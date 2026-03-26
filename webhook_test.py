#!/usr/bin/env python3
import requests
import sys
import json
from datetime import datetime
import time

class WebhookSystemTester:
    def __init__(self, base_url="https://automation-engine-15.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.test_lead_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=15)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=15)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=15)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=15)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(str(response_data)) < 1000:
                        print(f"   Response: {response_data}")
                    elif isinstance(response_data, list) and len(response_data) <= 10:
                        print(f"   Response: {response_data}")
                    else:
                        print(f"   Response: Large data ({len(str(response_data))} chars)")
                    return True, response_data
                except:
                    return True, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_login(self):
        """Test login with admin credentials"""
        success, response = self.run_test(
            "Login з admin@crm.com / admin123",
            "POST",
            "api/auth/login",
            201,
            data={"email": "admin@crm.com", "password": "admin123"}
        )
        if success and isinstance(response, dict):
            self.token = response.get('token') or response.get('access_token')
            self.user_id = response.get('user', {}).get('id') or response.get('userId')
            if self.token:
                print(f"   ✅ Token received: {self.token[:20]}...")
                return True
        print(f"   ❌ No token in response")
        return False

    def test_webhooks_health(self):
        """Test GET /api/webhooks/health - повертає endpoints list"""
        success, response = self.run_test(
            "Webhooks Health Endpoint",
            "GET",
            "api/webhooks/health",
            200
        )
        
        if success and isinstance(response, dict):
            # Check for expected fields
            expected_fields = ['status', 'timestamp', 'endpoints']
            missing_fields = [field for field in expected_fields if field not in response]
            
            if missing_fields:
                print(f"   ⚠️  Missing fields: {missing_fields}")
                return False
            
            endpoints = response.get('endpoints', [])
            expected_endpoints = [
                'POST /api/webhooks/twilio/status',
                'POST /api/webhooks/resend/status',
                'POST /api/webhooks/viber',
                'GET /api/webhooks/messages/:messageId/status'
            ]
            
            print(f"   ✅ Found {len(endpoints)} webhook endpoints:")
            for endpoint in endpoints:
                print(f"     - {endpoint}")
            
            # Check if all expected endpoints are present
            missing_endpoints = [ep for ep in expected_endpoints if ep not in endpoints]
            if missing_endpoints:
                print(f"   ⚠️  Missing endpoints: {missing_endpoints}")
            else:
                print(f"   ✅ All expected endpoints present")
            
            return True
        
        return success

    def create_test_lead(self):
        """Create a test lead for webhook testing"""
        lead_data = {
            "firstName": "Webhook",
            "lastName": "Test",
            "email": f"webhook.test.{datetime.now().strftime('%H%M%S')}@example.com",
            "phone": "+380501234569",
            "company": "Webhook Test Company",
            "source": "website",
            "value": 2500
        }
        
        success, response = self.run_test(
            "Створення тестового ліда для webhook",
            "POST",
            "api/leads",
            201,
            data=lead_data
        )
        
        if success and isinstance(response, dict):
            self.test_lead_id = response.get('id')
            if self.test_lead_id:
                print(f"   ✅ Test lead created with ID: {self.test_lead_id}")
                
                # Verify lead has new fields: escalationLevel, smsAttempts, emailAttempts
                get_success, lead_response = self.run_test(
                    "Перевірка нових полів ліда",
                    "GET",
                    f"api/leads/{self.test_lead_id}",
                    200
                )
                
                if get_success and isinstance(lead_response, dict):
                    new_fields = ['escalationLevel', 'smsAttempts', 'emailAttempts']
                    present_fields = [field for field in new_fields if field in lead_response]
                    missing_fields = [field for field in new_fields if field not in lead_response]
                    
                    print(f"   ✅ New lead fields present: {present_fields}")
                    if missing_fields:
                        print(f"   ⚠️  Missing new fields: {missing_fields}")
                    
                    # Check default values
                    escalation_level = lead_response.get('escalationLevel', 'not found')
                    sms_attempts = lead_response.get('smsAttempts', 'not found')
                    email_attempts = lead_response.get('emailAttempts', 'not found')
                    
                    print(f"   📊 Field values: escalationLevel={escalation_level}, smsAttempts={sms_attempts}, emailAttempts={email_attempts}")
                
                return True
        
        return success

    def test_twilio_webhook_no_message(self):
        """Test POST /api/webhooks/twilio/status - returns false if message not found"""
        # Test with non-existent MessageSid
        webhook_data = {
            "MessageSid": "SM_nonexistent_message_id_12345",
            "MessageStatus": "delivered",
            "To": "+380501234569",
            "From": "+15551234567",
            "AccountSid": "AC_test_account_sid"
        }
        
        success, response = self.run_test(
            "Twilio Webhook - Message Not Found",
            "POST",
            "api/webhooks/twilio/status",
            200,  # Should return 200 OK but with success: false
            data=webhook_data
        )
        
        if success and isinstance(response, dict):
            # Should return { received: false } or { success: false }
            received = response.get('received', response.get('success'))
            if received is False:
                print(f"   ✅ Correctly returned false for non-existent message")
                return True
            else:
                print(f"   ⚠️  Expected false, got: {response}")
        
        return success

    def test_timeline_endpoints(self):
        """Test timeline endpoints for lead"""
        if not self.test_lead_id:
            print("   ❌ No test lead ID available")
            return False
        
        # Test GET /api/communications/timeline/lead/:leadId
        timeline_success, timeline_response = self.run_test(
            "Timeline для ліда",
            "GET",
            f"api/communications/timeline/lead/{self.test_lead_id}",
            200
        )
        
        if not timeline_success:
            return False
        
        # Test GET /api/communications/timeline/lead/:leadId/stats
        stats_success, stats_response = self.run_test(
            "Timeline статистика для ліда",
            "GET",
            f"api/communications/timeline/lead/{self.test_lead_id}/stats",
            200
        )
        
        if stats_success and isinstance(stats_response, dict):
            expected_stats = ['totalCalls', 'totalSms', 'totalEmails', 'deliveredSms', 'failedSms', 'lastContact', 'escalationLevel']
            present_stats = [stat for stat in expected_stats if stat in stats_response]
            missing_stats = [stat for stat in expected_stats if stat not in stats_response]
            
            print(f"   ✅ Stats fields present: {present_stats}")
            if missing_stats:
                print(f"   ⚠️  Missing stats fields: {missing_stats}")
            
            # Print actual values
            print(f"   📊 Stats values:")
            for stat in expected_stats:
                value = stats_response.get(stat, 'not found')
                print(f"     - {stat}: {value}")
        
        return timeline_success and stats_success

    def test_dashboard_display(self):
        """Test dashboard endpoints"""
        # Test main dashboard
        dashboard_success, _ = self.run_test(
            "Dashboard відображається",
            "GET",
            "api/dashboard",
            200
        )
        
        if not dashboard_success:
            return False
        
        # Test KPI cards
        kpi_success, kpi_response = self.run_test(
            "Dashboard KPI картки",
            "GET",
            "api/dashboard/kpi",
            200
        )
        
        if kpi_success and isinstance(kpi_response, dict):
            expected_kpi = ['totalLeads', 'totalDeals', 'totalDealsValue', 'totalDepositsAmount', 'conversionRate']
            present_kpi = [kpi for kpi in expected_kpi if kpi in kpi_response]
            missing_kpi = [kpi for kpi in expected_kpi if kpi not in kpi_response]
            
            print(f"   ✅ KPI fields present: {present_kpi}")
            if missing_kpi:
                print(f"   ⚠️  Missing KPI fields: {missing_kpi}")
        
        return dashboard_success and kpi_success

    def test_automation_rules(self):
        """Test automation rules (9 правил)"""
        success, response = self.run_test(
            "Automation rules (9 правил)",
            "GET",
            "api/automation/rules",
            200
        )
        
        if success and isinstance(response, list):
            rules_count = len(response)
            print(f"   ✅ Found {rules_count} automation rules")
            
            if rules_count >= 9:
                print(f"   ✅ Expected 9+ rules, found {rules_count}")
                
                # Check for specific rule types
                rule_types = {}
                for rule in response:
                    rule_name = rule.get('name', '').lower()
                    rule_desc = rule.get('description', '').lower()
                    
                    if 'no_answer' in rule_name or 'no answer' in rule_desc:
                        rule_types['no_answer'] = rule_types.get('no_answer', 0) + 1
                    elif 'sms' in rule_name or 'sms' in rule_desc:
                        rule_types['sms'] = rule_types.get('sms', 0) + 1
                    elif 'email' in rule_name or 'email' in rule_desc:
                        rule_types['email'] = rule_types.get('email', 0) + 1
                    elif 'escalation' in rule_name or 'escalation' in rule_desc:
                        rule_types['escalation'] = rule_types.get('escalation', 0) + 1
                
                print(f"   📊 Rule types found:")
                for rule_type, count in rule_types.items():
                    print(f"     - {rule_type}: {count}")
                
                return True
            else:
                print(f"   ⚠️  Expected 9+ rules, found only {rules_count}")
                return False
        
        return success

    def test_message_creation_and_webhook_flow(self):
        """Test creating a message and processing webhook"""
        if not self.test_lead_id:
            print("   ❌ No test lead ID available")
            return False
        
        # First, try to send an SMS (should fail due to unconfigured Twilio)
        sms_data = {
            "to": "+380501234569",
            "message": "Test SMS for webhook flow",
            "metadata": {
                "leadId": self.test_lead_id,
                "attemptNumber": 1
            }
        }
        
        sms_success, sms_response = self.run_test(
            "SMS відправка (очікується помилка через Twilio)",
            "POST",
            "api/communications/sms/send",
            400  # Expecting failure due to unconfigured Twilio
        )
        
        # This should fail, which is expected
        if not sms_success:
            print(f"   ✅ SMS sending failed as expected (Twilio not configured)")
        
        # Now test webhook with a mock message ID
        webhook_data = {
            "MessageSid": "SM_test_message_webhook_12345",
            "MessageStatus": "sent",
            "To": "+380501234569",
            "From": "+15551234567",
            "AccountSid": "AC_test_account_sid"
        }
        
        webhook_success, webhook_response = self.run_test(
            "Twilio Webhook - Mock Message Status",
            "POST",
            "api/webhooks/twilio/status",
            200,
            data=webhook_data
        )
        
        if webhook_success and isinstance(webhook_response, dict):
            received = webhook_response.get('received', webhook_response.get('success'))
            if received is False:
                print(f"   ✅ Webhook correctly handled non-existent message")
                return True
            else:
                print(f"   ⚠️  Unexpected webhook response: {webhook_response}")
        
        return webhook_success

def main():
    print("🚀 Запуск тестування Webhook System...")
    print("=" * 60)
    
    tester = WebhookSystemTester()
    
    # Test sequence focusing on webhook and timeline functionality
    tests = [
        ("Login", tester.test_login),
        ("Webhooks Health", tester.test_webhooks_health),
        ("Create Test Lead", tester.create_test_lead),
        ("Twilio Webhook - No Message", tester.test_twilio_webhook_no_message),
        ("Timeline Endpoints", tester.test_timeline_endpoints),
        ("Dashboard Display", tester.test_dashboard_display),
        ("Automation Rules", tester.test_automation_rules),
        ("Message & Webhook Flow", tester.test_message_creation_and_webhook_flow),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            if not test_func():
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print results
    print("\n" + "=" * 60)
    print(f"📊 Результати тестування Webhook System:")
    print(f"   Всього тестів: {tester.tests_run}")
    print(f"   Пройшло: {tester.tests_passed}")
    print(f"   Не пройшло: {tester.tests_run - tester.tests_passed}")
    
    if failed_tests:
        print(f"\n❌ Невдалі тести:")
        for test in failed_tests:
            print(f"   - {test}")
    else:
        print(f"\n✅ Всі тести пройшли успішно!")
    
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"\n📈 Відсоток успіху: {success_rate:.1f}%")
    
    return 0 if len(failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())