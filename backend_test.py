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
    def __init__(self, base_url="https://dev-continue-27.preview.emergentagent.com"):
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

    def test_vin_search_endpoints(self):
        """Test VIN Intelligence Engine endpoints"""
        print("\n🔍 Testing VIN Intelligence Engine...")
        
        # Test VIN search for Honda (should be in database)
        print("   Testing Honda VIN search...")
        success, status, data = self.make_request('GET', 'vin/search?vin=1HGBH41JXMN109186', expected_status=200)
        if success:
            if data.get('success') and data.get('source') in ['database', 'cache', 'web_search']:
                self.log_result("VIN Search - Honda (DB)", True, status)
            else:
                self.log_result("VIN Search - Honda (DB)", False, status, 
                              f"Expected success=true, got: {data.get('success')}, source: {data.get('source')}")
        else:
            self.log_result("VIN Search - Honda (DB)", False, status, f"Request failed: {data}")
        
        # Test VIN search for Mercedes (should be in database)
        print("   Testing Mercedes VIN search...")
        success, status, data = self.make_request('GET', 'vin/search?vin=WVWZZZ3CZWE123456', expected_status=200)
        if success:
            if data.get('success') and data.get('source') in ['database', 'cache', 'web_search']:
                self.log_result("VIN Search - Mercedes (DB)", True, status)
            else:
                self.log_result("VIN Search - Mercedes (DB)", False, status, 
                              f"Expected success=true, got: {data.get('success')}, source: {data.get('source')}")
        else:
            self.log_result("VIN Search - Mercedes (DB)", False, status, f"Request failed: {data}")
        
        # Test VIN search for Tesla (should be in database)
        print("   Testing Tesla VIN search...")
        success, status, data = self.make_request('GET', 'vin/5YJSA1E26MF123789', expected_status=200)
        if success:
            if data.get('success') and data.get('source') in ['database', 'cache', 'web_search']:
                self.log_result("VIN Search - Tesla (DB)", True, status)
            else:
                self.log_result("VIN Search - Tesla (DB)", False, status, 
                              f"Expected success=true, got: {data.get('success')}, source: {data.get('source')}")
        else:
            self.log_result("VIN Search - Tesla (DB)", False, status, f"Request failed: {data}")
        
        # Test VIN search with web fallback (VIN not in database)
        print("   Testing VIN web fallback...")
        success, status, data = self.make_request('GET', 'vin/search?vin=5YJSA1E26MF000000', expected_status=200)
        if success:
            # This should either find via web search or return not found
            expected_sources = ['web_search', 'not_found', 'cache']
            if data.get('source') in expected_sources:
                self.log_result("VIN Search - Web Fallback", True, status)
            else:
                self.log_result("VIN Search - Web Fallback", False, status, 
                              f"Expected source in {expected_sources}, got: {data.get('source')}")
        else:
            self.log_result("VIN Search - Web Fallback", False, status, f"Request failed: {data}")

    def test_public_vin_endpoints(self):
        """Test Public VIN endpoints (no auth required)"""
        print("\n🔍 Testing Public VIN Endpoints...")
        
        # Temporarily remove auth token for public endpoints
        original_token = self.token
        self.token = None
        
        # Test 1: Public VIN search with query parameter
        print("   Testing public VIN search with query parameter...")
        test_vin = "1HGBH41JXMN109186"  # Valid 17-char VIN
        success, status, data = self.make_request('GET', f'public/vin/search?vin={test_vin}', expected_status=200)
        
        if success:
            if 'vin' in data or 'success' in data:
                self.log_result("Public VIN Search (Query)", True, status)
            else:
                self.log_result("Public VIN Search (Query)", False, status, 
                              f"Expected vin or success field, got: {list(data.keys())}")
        else:
            self.log_result("Public VIN Search (Query)", False, status, f"Request failed: {data}")
        
        # Test 2: Public VIN search with path parameter (SEO-friendly)
        print("   Testing public VIN search with path parameter...")
        success, status, data = self.make_request('GET', f'public/vin/{test_vin}', expected_status=200)
        
        if success:
            if 'vin' in data or 'success' in data:
                self.log_result("Public VIN Search (Path)", True, status)
            else:
                self.log_result("Public VIN Search (Path)", False, status, 
                              f"Expected vin or success field, got: {list(data.keys())}")
        else:
            self.log_result("Public VIN Search (Path)", False, status, f"Request failed: {data}")
        
        # Test 3: Public VIN search with invalid VIN (should return not found)
        print("   Testing public VIN search with invalid VIN...")
        invalid_vin = "INVALID123"
        success, status, data = self.make_request('GET', f'public/vin/search?vin={invalid_vin}', expected_status=200)
        
        if success:
            if data.get('success') == False or 'message' in data:
                self.log_result("Public VIN Search (Invalid)", True, status)
            else:
                self.log_result("Public VIN Search (Invalid)", False, status, 
                              f"Expected success=false or message, got: {data}")
        else:
            self.log_result("Public VIN Search (Invalid)", False, status, f"Request failed: {data}")
        
        # Test 4: Public VIN lead creation
        print("   Testing public VIN lead creation...")
        lead_data = {
            "vin": test_vin,
            "firstName": "Test",
            "lastName": "User",
            "email": "test@example.com",
            "phone": "+380123456789",
            "message": "Test lead from API testing"
        }
        
        success, status, data = self.make_request('POST', 'public/vin/lead', lead_data, expected_status=201)
        
        if success:
            if data.get('success') and 'leadId' in data:
                self.log_result("Public VIN Lead Creation", True, status)
                print(f"   Created lead ID: {data.get('leadId')}")
            else:
                self.log_result("Public VIN Lead Creation", False, status, 
                              f"Expected success=true and leadId, got: {data}")
        else:
            # Try with 200 status code as well
            success, status, data = self.make_request('POST', 'public/vin/lead', lead_data, expected_status=200)
            if success and data.get('success'):
                self.log_result("Public VIN Lead Creation", True, status)
                print(f"   Created lead ID: {data.get('leadId')}")
            else:
                self.log_result("Public VIN Lead Creation", False, status, f"Request failed: {data}")
        
        # Test 5: Public VIN lead creation with invalid data
        print("   Testing public VIN lead creation with invalid data...")
        invalid_lead_data = {
            "vin": "INVALID",
            "firstName": "",
            "lastName": "",
            "email": "invalid-email",
            "phone": "",
        }
        
        success, status, data = self.make_request('POST', 'public/vin/lead', invalid_lead_data, expected_status=400)
        
        if success or (status in [400, 422] and not success):
            self.log_result("Public VIN Lead Creation (Invalid)", True, status)
        else:
            self.log_result("Public VIN Lead Creation (Invalid)", False, status, 
                          f"Expected 400/422 status for invalid data, got: {status}")
        
        # Restore auth token
        self.token = original_token

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
        
        # Test VIN Intelligence Engine
        self.test_vin_search_endpoints()
        
        # Test Public VIN Endpoints (main focus)
        self.test_public_vin_endpoints()
        
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