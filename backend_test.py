#!/usr/bin/env python3
"""
Backend API Testing for CRM Auto Business Platform (BIBI Cars)
Testing all required endpoints for parser control and vehicle management
"""

import requests
import sys
import json
import time
from datetime import datetime
import uuid

class CRMAPITester:
    def __init__(self, base_url="https://a11y-testing.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.session = requests.Session()
        
    def log_result(self, test_name, success, status_code=None, error_msg=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED (Status: {status_code})")
        else:
            self.failed_tests.append({
                'test': test_name,
                'status_code': status_code,
                'error': error_msg
            })
            print(f"❌ {test_name} - FAILED (Status: {status_code}) - {error_msg}")
    
    def make_request(self, method, endpoint, data=None, expected_status=200):
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PATCH':
                response = self.session.patch(url, json=data, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text[:500]}
            
            return success, response.status_code, response_data
            
        except requests.exceptions.Timeout:
            return False, None, {"error": "Request timeout"}
        except requests.exceptions.ConnectionError:
            return False, None, {"error": "Connection error"}
        except Exception as e:
            return False, None, {"error": str(e)}

    def test_system_health(self):
        """Test system health endpoint"""
        print("\n🔍 Testing System Health...")
        success, status, data = self.make_request('GET', 'system/health', expected_status=200)
        
        if success and data.get('status') == 'healthy':
            self.log_result("System Health Check", True, status)
            return True
        else:
            self.log_result("System Health Check", False, status, 
                          f"Expected healthy status, got: {data.get('status', 'unknown')}")
            return False

    def test_auth_login(self):
        """Test authentication login"""
        print("\n🔍 Testing Authentication Login...")
        login_data = {
            "email": "admin@crm.com",
            "password": "admin123"
        }
        
        success, status, data = self.make_request('POST', 'auth/login', login_data, expected_status=201)
        
        if success and 'access_token' in data:
            self.token = data['access_token']
            self.log_result("Auth Login", True, status)
            return True
        else:
            self.log_result("Auth Login", False, status, 
                          f"No access_token in response: {data}")
            return False

    def test_parser_overview(self):
        """Test parser overview endpoint"""
        print("\n🔍 Testing Parser Overview...")
        success, status, data = self.make_request('GET', 'ingestion/admin/parsers', expected_status=200)
        
        if success:
            parsers = data.get('parsers', [])
            has_copart = any(p.get('source') == 'copart' for p in parsers)
            has_iaai = any(p.get('source') == 'iaai' for p in parsers)
            
            if has_copart and has_iaai:
                self.log_result("Parser Overview", True, status)
                return True
            else:
                self.log_result("Parser Overview", False, status, 
                              f"Missing parsers - Copart: {has_copart}, IAAI: {has_iaai}")
                return False
        else:
            self.log_result("Parser Overview", False, status, f"Request failed: {data}")
            return False

    def test_parser_run(self):
        """Test parser run endpoint"""
        print("\n🔍 Testing Parser Run (Copart)...")
        success, status, data = self.make_request('POST', 'ingestion/admin/parsers/copart/run', 
                                                expected_status=200)
        
        if success:
            self.log_result("Parser Run (Copart)", True, status)
            return True
        else:
            self.log_result("Parser Run (Copart)", False, status, f"Run failed: {data}")
            return False

    def test_vehicles_list(self):
        """Test vehicles list endpoint"""
        print("\n🔍 Testing Vehicles List...")
        success, status, data = self.make_request('GET', 'vehicles?limit=5', expected_status=200)
        
        if success:
            items = data.get('items', [])
            if len(items) > 0:
                self.log_result("Vehicles List", True, status)
                print(f"   Found {len(items)} vehicles")
                return True
            else:
                self.log_result("Vehicles List", False, status, "No vehicles found in response")
                return False
        else:
            self.log_result("Vehicles List", False, status, f"Request failed: {data}")
            return False

    def test_vehicles_stats(self):
        """Test vehicles stats endpoint"""
        print("\n🔍 Testing Vehicles Stats...")
        success, status, data = self.make_request('GET', 'vehicles/stats', expected_status=200)
        
        if success:
            required_fields = ['total', 'bySource', 'byStatus', 'priceRange']
            missing_fields = [field for field in required_fields if field not in data]
            
            if not missing_fields:
                self.log_result("Vehicles Stats", True, status)
                print(f"   Total vehicles: {data.get('total', 0)}")
                return True
            else:
                self.log_result("Vehicles Stats", False, status, 
                              f"Missing fields: {missing_fields}")
                return False
        else:
            self.log_result("Vehicles Stats", False, status, f"Request failed: {data}")
            return False

    def test_proxies_list(self):
        """Test proxies list endpoint"""
        print("\n🔍 Testing Proxies List...")
        success, status, data = self.make_request('GET', 'ingestion/admin/proxies', expected_status=200)
        
        if success:
            self.log_result("Proxies List", True, status)
            proxies = data if isinstance(data, list) else data.get('proxies', [])
            print(f"   Found {len(proxies)} proxies")
            return True
        else:
            self.log_result("Proxies List", False, status, f"Request failed: {data}")
            return False

    def test_additional_endpoints(self):
        """Test additional important endpoints"""
        print("\n🔍 Testing Additional Endpoints...")
        
        # Test health overview
        success, status, data = self.make_request('GET', 'ingestion/admin/health', expected_status=200)
        self.log_result("Parser Health Overview", success, status, 
                       None if success else f"Request failed: {data}")
        
        # Test alerts
        success, status, data = self.make_request('GET', 'ingestion/admin/alerts', expected_status=200)
        self.log_result("Parser Alerts", success, status, 
                       None if success else f"Request failed: {data}")
        
        # Test vehicle makes
        success, status, data = self.make_request('GET', 'vehicles/makes', expected_status=200)
        self.log_result("Vehicle Makes", success, status, 
                       None if success else f"Request failed: {data}")

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting CRM Auto Business Platform API Tests")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test system health first
        if not self.test_system_health():
            print("\n❌ System health check failed - stopping tests")
            return False
        
        # Test authentication
        if not self.test_auth_login():
            print("\n❌ Authentication failed - stopping tests")
            return False
        
        # Test core functionality
        self.test_parser_overview()
        self.test_parser_run()
        self.test_vehicles_list()
        self.test_vehicles_stats()
        self.test_proxies_list()
        
        # Test additional endpoints
        self.test_additional_endpoints()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"   - {test['test']}: {test['error']}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"✅ Success Rate: {success_rate:.1f}%")
        
        return success_rate >= 80  # Consider 80%+ as successful

def main():
    """Main test execution"""
    tester = CRMAPITester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n⚠️ Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())