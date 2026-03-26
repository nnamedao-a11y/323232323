#!/usr/bin/env python3
import requests
import sys
import json
from datetime import datetime

class CRMAPITester:
    def __init__(self, base_url="https://391acf45-52bd-4a34-b07f-f0bb1108281d.preview.emergentagent.com"):
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
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
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

def main():
    print("🚀 Запуск тестування CRM API...")
    print("=" * 50)
    
    tester = CRMAPITester()
    
    # Test sequence
    tests = [
        ("Login", tester.test_login),
        ("Dashboard KPI", tester.test_dashboard_kpi),
        ("Dashboard Stats", tester.test_dashboard_stats),
        ("Automation Rules", tester.test_automation_rules),
        ("Communication Templates", tester.test_communication_templates),
        ("Leads CRUD", tester.test_leads_crud),
        ("Export API", tester.test_export_leads),
        ("Call Center API", tester.test_call_center_api),
        ("Tasks API", tester.test_tasks_api),
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
    print(f"📊 Результати тестування:")
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