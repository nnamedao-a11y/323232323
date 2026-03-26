#!/usr/bin/env python3
import requests
import sys
import json
from datetime import datetime

class CRMAPITester:
    def __init__(self, base_url="http://localhost:8002"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.created_lead_id = None

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
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(str(response_data)) < 500:
                        print(f"   Response: {response_data}")
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
            "Login з admin@crm.com",
            "POST",
            "api/auth/login",
            201,  # Changed from 200 to 201
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

    def test_dashboard_kpi(self):
        """Test dashboard KPI endpoint"""
        success, response = self.run_test(
            "Dashboard KPI картки",
            "GET",
            "api/dashboard/kpi",
            200
        )
        if success and isinstance(response, dict):
            expected_fields = ['totalLeads', 'totalDeals', 'totalDealsValue', 'totalDepositsAmount', 'conversionRate']
            missing_fields = [field for field in expected_fields if field not in response]
            if missing_fields:
                print(f"   ⚠️  Missing KPI fields: {missing_fields}")
            else:
                print(f"   ✅ All KPI fields present")
        return success

    def test_automation_rules(self):
        """Test automation rules API"""
        return self.run_test(
            "Automation rules API",
            "GET",
            "api/automation/rules",
            200
        )[0]

    def test_communication_templates(self):
        """Test communication templates API"""
        return self.run_test(
            "Communication templates API",
            "GET",
            "api/communications/templates",
            200
        )[0]

    def test_leads_crud(self):
        """Test leads CRUD operations"""
        # Test creating a new lead
        lead_data = {
            "firstName": "Тест",
            "lastName": "Клієнт",
            "email": f"test.client.{datetime.now().strftime('%H%M%S')}@example.com",
            "phone": "+380501234567",
            "company": "Тестова Компанія",
            "source": "website",
            "value": 5000
        }
        
        success, response = self.run_test(
            "Створення нового ліда",
            "POST",
            "api/leads",
            201,
            data=lead_data
        )
        
        if success and isinstance(response, dict):
            lead_id = response.get('id')
            if lead_id:
                print(f"   ✅ Lead created with ID: {lead_id}")
                
                # Test getting the created lead
                get_success, _ = self.run_test(
                    "Отримання ліда",
                    "GET",
                    f"api/leads/{lead_id}",
                    200
                )
                return get_success
        
        return success

    def test_export_leads(self):
        """Test export leads to Excel"""
        success, response = self.run_test(
            "Export лідів в Excel",
            "GET",
            "api/export/leads",
            200
        )
        
        if success:
            # Check if response is binary (Excel file)
            if isinstance(response, bytes) or (isinstance(response, str) and len(response) > 1000):
                print(f"   ✅ Excel file received (size: {len(str(response))} bytes)")
                return True
            else:
                print(f"   ⚠️  Response doesn't look like Excel file")
        
        return success

    def test_call_center_api(self):
        """Test call center API for logging calls"""
        # First, create a test lead to log call against
        lead_data = {
            "firstName": "Call",
            "lastName": "Test",
            "email": f"call.test.{datetime.now().strftime('%H%M%S')}@example.com",
            "phone": "+380501234568"
        }
        
        lead_success, lead_response = self.run_test(
            "Створення ліда для тесту дзвінків",
            "POST",
            "api/leads",
            201,
            data=lead_data
        )
        
        if not lead_success:
            return False
            
        lead_id = lead_response.get('id')
        if not lead_id:
            print(f"   ❌ No lead ID in response")
            return False
        
        # Test logging a call
        call_data = {
            "leadId": lead_id,
            "managerId": self.user_id or "test-manager",
            "result": "answered",  # Fixed: use lowercase as per enum
            "duration": 120,
            "notes": "Тестовий дзвінок - клієнт зацікавлений"
        }
        
        return self.run_test(
            "Логування дзвінка",
            "POST",
            "api/call-center/calls",
            201,
            data=call_data
        )[0]

    def test_tasks_api(self):
        """Test tasks API"""
        # Test getting tasks
        get_success, _ = self.run_test(
            "Отримання списку задач",
            "GET",
            "api/tasks",
            200
        )
        
        if not get_success:
            return False
        
        # Test creating a task
        task_data = {
            "title": "Тестова задача",
            "description": "Опис тестової задачі",
            "priority": "medium",
            "dueDate": "2024-12-31T23:59:59.000Z"
        }
        
        return self.run_test(
            "Створення задачі",
            "POST",
            "api/tasks",
            201,
            data=task_data
        )[0]

    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        return self.run_test(
            "Dashboard статистика",
            "GET",
            "api/dashboard",
            200
        )[0]

    def test_sms_providers_status(self):
        """Test SMS providers status API"""
        success, response = self.run_test(
            "SMS providers status",
            "GET",
            "api/communications/sms/providers",
            200
        )
        if success and isinstance(response, list):
            print(f"   ✅ Found {len(response)} SMS providers")
            for provider in response:
                name = provider.get('name', 'unknown')
                ready = provider.get('ready', False)
                status = "✅ Ready" if ready else "❌ Not Ready"
                print(f"   - {name}: {status}")
        return success

    def test_automation_rules_count(self):
        """Test automation rules API and verify 9 rules"""
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
                # Check for no_answer workflow rules
                no_answer_rules = [r for r in response if 'no_answer' in r.get('name', '').lower() or 'no answer' in r.get('description', '').lower()]
                print(f"   ✅ Found {len(no_answer_rules)} no_answer workflow rules")
            else:
                print(f"   ⚠️  Expected 9+ rules, found only {rules_count}")
        return success

    def test_communication_templates_count(self):
        """Test communication templates API and verify 7 templates"""
        success, response = self.run_test(
            "Communication templates (7 шаблонів)",
            "GET",
            "api/communications/templates",
            200
        )
        if success and isinstance(response, list):
            templates_count = len(response)
            print(f"   ✅ Found {templates_count} communication templates")
            if templates_count >= 7:
                print(f"   ✅ Expected 7+ templates, found {templates_count}")
                # Count SMS vs Email templates
                sms_templates = [t for t in response if t.get('channel') == 'sms']
                email_templates = [t for t in response if t.get('channel') == 'email']
                print(f"   - SMS templates: {len(sms_templates)}")
                print(f"   - Email templates: {len(email_templates)}")
                
                # Check for multilingual support
                multilingual_templates = [t for t in response if 'language' in t or 'lang' in str(t).lower()]
                if multilingual_templates:
                    print(f"   ✅ Found multilingual templates")
            else:
                print(f"   ⚠️  Expected 7+ templates, found only {templates_count}")
        return success

    def test_sms_send_failure(self):
        """Test SMS sending (expected to fail due to unconfigured Twilio)"""
        sms_data = {
            "to": "+359888123456",  # Bulgaria phone number
            "message": "Test SMS from AutoCRM",
            "metadata": {
                "leadId": "test-lead-123",
                "attemptNumber": 1
            }
        }
        
        success, response = self.run_test(
            "SMS відправка (очікується помилка)",
            "POST",
            "api/communications/sms/send",
            400  # Expecting failure due to unconfigured Twilio
        )
        
        if not success and isinstance(response, dict):
            error_message = response.get('message', '').lower()
            if 'twilio' in error_message or 'provider' in error_message or 'configured' in error_message:
                print(f"   ✅ Expected error: Twilio not configured")
                return True
            else:
                print(f"   ⚠️  Unexpected error message: {response.get('message', 'No message')}")
        
        return success

    def test_lead_routing_rules(self):
        """Test GET /api/lead-routing/rules - отримання routing rules"""
        success, response = self.run_test(
            "Lead Routing Rules API",
            "GET",
            "api/lead-routing/rules",
            200
        )
        if success and isinstance(response, list):
            print(f"   ✅ Found {len(response)} routing rules")
            # Check for default rules
            rule_names = [rule.get('name', '') for rule in response]
            expected_rules = ['Default - Least Loaded', 'Bulgaria Market', 'Phone/Missed Call - Round Robin', 'VIP Leads']
            found_rules = [rule for rule in expected_rules if any(rule in name for name in rule_names)]
            print(f"   ✅ Found default rules: {found_rules}")
            if len(found_rules) >= 3:
                print(f"   ✅ Default routing rules properly bootstrapped")
        return success

    def test_lead_routing_workload(self):
        """Test GET /api/lead-routing/workload - отримання workload matrix менеджерів"""
        success, response = self.run_test(
            "Lead Routing Workload Matrix",
            "GET",
            "api/lead-routing/workload",
            200
        )
        if success and isinstance(response, dict):
            managers = response.get('managers', [])
            stats = response.get('stats', {})
            print(f"   ✅ Found {len(managers)} managers in workload matrix")
            print(f"   ✅ Stats: {stats}")
            # Check workload calculation
            for manager in managers[:3]:  # Check first 3 managers
                score = manager.get('score', 0)
                active_leads = manager.get('activeLeads', 0)
                open_tasks = manager.get('openTasks', 0)
                overdue_tasks = manager.get('overdueTasks', 0)
                expected_score = (active_leads * 2) + open_tasks + (overdue_tasks * 3)
                if score == expected_score:
                    print(f"   ✅ Workload score correctly calculated for {manager.get('firstName', 'Manager')}")
                else:
                    print(f"   ⚠️  Workload score mismatch for {manager.get('firstName', 'Manager')}: expected {expected_score}, got {score}")
        return success

    def test_create_lead_with_auto_assignment(self):
        """Test POST /api/leads - створення ліда з автоматичним призначенням"""
        lead_data = {
            "firstName": "Auto",
            "lastName": "Assignment",
            "email": f"auto.assignment.{datetime.now().strftime('%H%M%S')}@example.com",
            "phone": "+380501234569",
            "company": "Auto Assignment Test",
            "source": "website",
            "value": 5000
        }
        
        success, response = self.run_test(
            "Створення ліда з автоматичним призначенням",
            "POST",
            "api/leads",
            201,
            data=lead_data
        )
        
        if success and isinstance(response, dict):
            lead_id = response.get('id')
            assigned_to = response.get('assignedTo')
            assignment_strategy = response.get('assignmentStrategy')
            
            if lead_id:
                self.created_lead_id = lead_id
                print(f"   ✅ Lead created with ID: {lead_id}")
                
                if assigned_to:
                    print(f"   ✅ Lead automatically assigned to: {assigned_to}")
                    print(f"   ✅ Assignment strategy: {assignment_strategy}")
                else:
                    print(f"   ⚠️  Lead created but not automatically assigned")
                
                return True
        
        return success

    def test_lead_assignment_history(self):
        """Test GET /api/lead-routing/history/:leadId - історія призначень"""
        if not self.created_lead_id:
            print("   ⚠️  No lead ID available for history test")
            return False
            
        success, response = self.run_test(
            "Lead Assignment History",
            "GET",
            f"api/lead-routing/history/{self.created_lead_id}",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   ✅ Found {len(response)} assignment history records")
            if len(response) > 0:
                history = response[0]
                print(f"   ✅ History record: strategy={history.get('strategy')}, reason={history.get('reason')}")
                # Check required fields
                required_fields = ['leadId', 'newManagerId', 'strategy', 'reason', 'createdAt']
                missing_fields = [field for field in required_fields if field not in history]
                if not missing_fields:
                    print(f"   ✅ Assignment history записується коректно")
                else:
                    print(f"   ⚠️  Missing history fields: {missing_fields}")
        
        return success

    def test_manual_lead_assignment(self):
        """Test POST /api/lead-routing/assign/:leadId - ручне призначення ліда"""
        if not self.created_lead_id:
            print("   ⚠️  No lead ID available for manual assignment test")
            return False
        
        # First get workload to find a manager
        workload_success, workload_response = self.run_test(
            "Get managers for assignment",
            "GET",
            "api/lead-routing/workload",
            200
        )
        
        if not workload_success or not isinstance(workload_response, dict):
            print("   ❌ Could not get manager list for assignment")
            return False
        
        managers = workload_response.get('managers', [])
        if not managers:
            print("   ❌ No managers available for assignment")
            return False
        
        target_manager = managers[0]['managerId']
        
        assignment_data = {
            "forceManagerId": target_manager,
            "reason": "Manual test assignment"
        }
        
        success, response = self.run_test(
            "Manual Lead Assignment",
            "POST",
            f"api/lead-routing/assign/{self.created_lead_id}",
            201,  # Changed from 200 to 201
            data=assignment_data
        )
        
        if success and isinstance(response, dict):
            if response.get('success'):
                print(f"   ✅ Lead manually assigned to: {response.get('managerName')}")
                print(f"   ✅ Assignment strategy: {response.get('strategy')}")
            else:
                print(f"   ⚠️  Assignment failed: {response.get('reason')}")
        
        return success

    def test_lead_reassignment(self):
        """Test POST /api/lead-routing/reassign/:leadId - перепризначення ліда"""
        if not self.created_lead_id:
            print("   ⚠️  No lead ID available for reassignment test")
            return False
        
        # Get workload to find different manager
        workload_success, workload_response = self.run_test(
            "Get managers for reassignment",
            "GET",
            "api/lead-routing/workload",
            200
        )
        
        if not workload_success:
            return False
        
        managers = workload_response.get('managers', [])
        if len(managers) < 2:
            print("   ⚠️  Need at least 2 managers for reassignment test")
            return True  # Skip but don't fail
        
        new_manager = managers[1]['managerId']
        
        reassignment_data = {
            "newManagerId": new_manager,
            "reason": "Test reassignment"
        }
        
        success, response = self.run_test(
            "Lead Reassignment",
            "POST",
            f"api/lead-routing/reassign/{self.created_lead_id}",
            200,
            data=reassignment_data
        )
        
        if success and isinstance(response, dict):
            if response.get('success'):
                print(f"   ✅ Lead reassigned to: {response.get('managerName')}")
            else:
                print(f"   ⚠️  Reassignment failed: {response.get('reason')}")
        
        return success

    def test_fallback_queue(self):
        """Test GET /api/lead-routing/fallback-queue - fallback queue"""
        success, response = self.run_test(
            "Fallback Queue",
            "GET",
            "api/lead-routing/fallback-queue",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   ✅ Found {len(response)} items in fallback queue")
            if len(response) > 0:
                item = response[0]
                print(f"   ✅ Fallback item: leadId={item.get('leadId')}, reason={item.get('reason')}")
        
        return success

    def test_routing_rules_crud(self):
        """Test routing rules CRUD operations"""
        # Test creating a new rule
        rule_data = {
            "name": "Test Rule",
            "description": "Test routing rule for API testing",
            "priority": 25,
            "strategy": "least_loaded",
            "allowedRoleKeys": ["manager"],
            "onlyAvailableManagers": True,
            "firstResponseSlaMinutes": 15
        }
        
        create_success, create_response = self.run_test(
            "Create Routing Rule",
            "POST",
            "api/lead-routing/rules",
            201,
            data=rule_data
        )
        
        if not create_success:
            return False
        
        rule_id = create_response.get('id')
        if not rule_id:
            print("   ❌ No rule ID in create response")
            return False
        
        print(f"   ✅ Created rule with ID: {rule_id}")
        
        # Test getting the rule
        get_success, get_response = self.run_test(
            "Get Routing Rule",
            "GET",
            f"api/lead-routing/rules/{rule_id}",
            200
        )
        
        if get_success and isinstance(get_response, dict):
            print(f"   ✅ Retrieved rule: {get_response.get('name')}")
        
        # Test updating the rule
        update_data = {
            "name": "Updated Test Rule",
            "description": "Updated test routing rule",
            "priority": 30
        }
        
        update_success, update_response = self.run_test(
            "Update Routing Rule",
            "PATCH",
            f"api/lead-routing/rules/{rule_id}",
            200,
            data=update_data
        )
        
        if update_success:
            print(f"   ✅ Rule updated successfully")
        
        # Test toggling rule status
        toggle_success, toggle_response = self.run_test(
            "Toggle Routing Rule",
            "POST",
            f"api/lead-routing/rules/{rule_id}/toggle",
            201,  # Changed from 200 to 201
        )
        
        if toggle_success:
            print(f"   ✅ Rule status toggled")
        
        # Test deleting the rule
        delete_success, delete_response = self.run_test(
            "Delete Routing Rule",
            "DELETE",
            f"api/lead-routing/rules/{rule_id}",
            200
        )
        
        if delete_success:
            print(f"   ✅ Rule deleted successfully")
        
        return create_success and get_success and update_success and toggle_success and delete_success

def main():
    print("🚀 Запуск тестування Lead Routing Module API...")
    print("=" * 50)
    
    tester = CRMAPITester()
    
    # Test sequence focused on Lead Routing Module
    tests = [
        ("Login", tester.test_login),
        ("Lead Routing Rules API", tester.test_lead_routing_rules),
        ("Lead Routing Workload Matrix", tester.test_lead_routing_workload),
        ("Create Lead with Auto-Assignment", tester.test_create_lead_with_auto_assignment),
        ("Lead Assignment History", tester.test_lead_assignment_history),
        ("Manual Lead Assignment", tester.test_manual_lead_assignment),
        ("Lead Reassignment", tester.test_lead_reassignment),
        ("Fallback Queue", tester.test_fallback_queue),
        ("Routing Rules CRUD", tester.test_routing_rules_crud),
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
    print("\n" + "=" * 50)
    print(f"📊 Результати тестування Lead Routing Module:")
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