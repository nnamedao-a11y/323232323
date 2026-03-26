#!/usr/bin/env python3
import requests
import sys
import json
import time
from datetime import datetime

class SlaApiTester:
    def __init__(self, base_url="https://accessibility-hub-12.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None

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
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers, timeout=15)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=15)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(str(response_data)) < 1000:
                        print(f"   Response: {json.dumps(response_data, indent=2)}")
                    elif isinstance(response_data, dict):
                        print(f"   Response keys: {list(response_data.keys())}")
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
            201,
            data={"email": "admin@crm.com", "password": "admin123"}
        )
        if success and isinstance(response, dict):
            self.token = response.get('access_token') or response.get('token')
            self.user_id = response.get('user', {}).get('id') or response.get('userId')
            if self.token:
                print(f"   ✅ Token received: {self.token[:20]}...")
                return True
        print(f"   ❌ No token in response")
        return False

    def test_sla_config(self):
        """Test SLA configuration endpoint"""
        success, response = self.run_test(
            "SLA Config - GET /api/sla/config",
            "GET",
            "api/sla/config",
            200
        )
        if success and isinstance(response, dict):
            # Check for expected SLA config fields
            expected_fields = [
                'CALLBACK_FIRST_RESPONSE_MINUTES',
                'CALLBACK_FOLLOW_UP_MINUTES', 
                'CALLBACK_ESCALATION_1_MINUTES',
                'CALLBACK_ESCALATION_2_MINUTES',
                'CALLBACK_MAX_ATTEMPTS',
                'LEAD_FIRST_RESPONSE_MINUTES',
                'LEAD_NO_ACTIVITY_HOURS',
                'LEAD_STALE_HOURS',
                'MANAGER_INACTIVE_MINUTES'
            ]
            missing_fields = [field for field in expected_fields if field not in response]
            if missing_fields:
                print(f"   ⚠️  Missing SLA config fields: {missing_fields}")
            else:
                print(f"   ✅ All SLA config fields present")
                
            # Validate specific values
            callback_first = response.get('CALLBACK_FIRST_RESPONSE_MINUTES', 0)
            lead_first = response.get('LEAD_FIRST_RESPONSE_MINUTES', 0)
            print(f"   ✅ Callback first response SLA: {callback_first} minutes")
            print(f"   ✅ Lead first response SLA: {lead_first} minutes")
        return success

    def test_sla_stats(self):
        """Test SLA statistics endpoint"""
        success, response = self.run_test(
            "SLA Stats - GET /api/sla/stats",
            "GET",
            "api/sla/stats",
            200
        )
        if success and isinstance(response, dict):
            # Check for expected stats fields
            expected_fields = ['total', 'byLevel', 'byType', 'byManager']
            missing_fields = [field for field in expected_fields if field not in response]
            if missing_fields:
                print(f"   ⚠️  Missing SLA stats fields: {missing_fields}")
            else:
                print(f"   ✅ All SLA stats fields present")
                
            # Validate stats structure
            total = response.get('total', 0)
            by_level = response.get('byLevel', {})
            by_type = response.get('byType', {})
            by_manager = response.get('byManager', {})
            
            print(f"   ✅ Total SLA breaches: {total}")
            print(f"   ✅ Breaches by level: {by_level}")
            print(f"   ✅ Breaches by type: {by_type}")
            print(f"   ✅ Breaches by manager count: {len(by_manager)}")
        return success

    def test_sla_breaches(self):
        """Test SLA breaches endpoint"""
        success, response = self.run_test(
            "SLA Breaches - GET /api/sla/breaches",
            "GET",
            "api/sla/breaches",
            200
        )
        if success and isinstance(response, list):
            print(f"   ✅ Active SLA breaches returned: {len(response)} items")
            
            # Check structure of breach records if any exist
            if len(response) > 0:
                breach = response[0]
                expected_fields = ['id', 'type', 'entityId', 'managerId', 'slaMinutes', 'actualMinutes', 'breachLevel', 'createdAt']
                missing_fields = [field for field in expected_fields if field not in breach]
                if missing_fields:
                    print(f"   ⚠️  Missing breach record fields: {missing_fields}")
                else:
                    print(f"   ✅ Breach record structure is complete")
                    print(f"   ✅ Sample breach: Type={breach.get('type')}, Level={breach.get('breachLevel')}, Manager={breach.get('managerName', 'Unknown')}")
            else:
                print(f"   ✅ No active SLA breaches (good!)")
        return success

    def test_sla_manager_breaches(self):
        """Test SLA breaches by manager endpoint"""
        # First get a manager ID from the stats
        success_stats, stats_response = self.run_test(
            "SLA Stats for Manager ID",
            "GET",
            "api/sla/stats",
            200
        )
        
        if success_stats and isinstance(stats_response, dict):
            by_manager = stats_response.get('byManager', {})
            if by_manager:
                # Get first manager ID
                manager_name = list(by_manager.keys())[0]
                # For testing, we'll use a dummy manager ID since we don't have real manager IDs
                test_manager_id = "test-manager-id"
                
                success, response = self.run_test(
                    f"SLA Breaches by Manager - GET /api/sla/breaches/manager/{test_manager_id}",
                    "GET",
                    f"api/sla/breaches/manager/{test_manager_id}",
                    200
                )
                if success and isinstance(response, list):
                    print(f"   ✅ Manager breaches returned: {len(response)} items")
                return success
        
        # If no managers in stats, just test with dummy ID
        success, response = self.run_test(
            "SLA Breaches by Manager - GET /api/sla/breaches/manager/dummy",
            "GET",
            "api/sla/breaches/manager/dummy",
            200
        )
        return success

    def test_sla_manual_checks(self):
        """Test manual SLA check triggers"""
        # Test callback check trigger
        success1, response1 = self.run_test(
            "SLA Manual Callback Check - POST /api/sla/check/callbacks",
            "POST",
            "api/sla/check/callbacks",
            200
        )
        
        # Test lead check trigger
        success2, response2 = self.run_test(
            "SLA Manual Lead Check - POST /api/sla/check/leads",
            "POST",
            "api/sla/check/leads",
            200
        )
        
        if success1 and isinstance(response1, dict):
            if response1.get('success'):
                print(f"   ✅ Callback SLA check triggered successfully")
            else:
                print(f"   ⚠️  Callback SLA check response: {response1}")
                
        if success2 and isinstance(response2, dict):
            if response2.get('success'):
                print(f"   ✅ Lead SLA check triggered successfully")
            else:
                print(f"   ⚠️  Lead SLA check response: {response2}")
        
        return success1 and success2

    def test_basic_endpoints(self):
        """Test basic endpoints that should be available"""
        endpoints = [
            ("Dashboard", "api/dashboard"),
            ("Staff", "api/staff"),
            ("Documents", "api/documents"),
            ("Settings", "api/settings"),
            ("Tasks", "api/tasks"),
            ("Deposits", "api/deposits")
        ]
        
        all_success = True
        for name, endpoint in endpoints:
            success, response = self.run_test(
                f"{name} - GET /{endpoint}",
                "GET",
                endpoint,
                200
            )
            if success:
                if isinstance(response, dict) and 'data' in response:
                    count = len(response['data'])
                    print(f"   ✅ {name} returned {count} items")
                elif isinstance(response, list):
                    print(f"   ✅ {name} returned {len(response)} items")
                else:
                    print(f"   ✅ {name} endpoint responded successfully")
            else:
                all_success = False
                
        return all_success

def main():
    print("🚀 Запуск тестування SLA API та основних endpoints...")
    print("=" * 60)
    
    tester = SlaApiTester()
    
    # Test sequence focused on SLA and basic functionality
    tests = [
        ("Authentication", tester.test_login),
        ("SLA Config API", tester.test_sla_config),
        ("SLA Stats API", tester.test_sla_stats),
        ("SLA Breaches API", tester.test_sla_breaches),
        ("SLA Manager Breaches API", tester.test_sla_manager_breaches),
        ("SLA Manual Checks", tester.test_sla_manual_checks),
        ("Basic Endpoints", tester.test_basic_endpoints),
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
    print(f"📊 Результати тестування SLA API:")
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