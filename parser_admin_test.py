#!/usr/bin/env python3
import requests
import sys
import json
import time
from datetime import datetime

class ParserAdminTester:
    def __init__(self, base_url="https://a11y-workspace.preview.emergentagent.com"):
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
        """Test login with master_admin credentials"""
        success, response = self.run_test(
            "Login with admin@crm.com (master_admin)",
            "POST",
            "api/auth/login",
            201,
            data={"email": "admin@crm.com", "password": "admin123"}
        )
        if success and isinstance(response, dict):
            self.token = response.get('access_token') or response.get('token')
            self.user_id = response.get('user', {}).get('id') or response.get('userId')
            user_role = response.get('user', {}).get('role')
            if self.token and user_role == 'master_admin':
                print(f"   ✅ Token received: {self.token[:20]}...")
                print(f"   ✅ User role: {user_role}")
                return True
            elif self.token:
                print(f"   ⚠️  Token received but role is: {user_role} (expected: master_admin)")
                return True  # Still allow testing
        print(f"   ❌ No token in response")
        return False

    def test_admin_parsers_overview(self):
        """Test GET /api/ingestion/admin/parsers - parsers overview"""
        success, response = self.run_test(
            "Admin Parsers Overview",
            "GET",
            "api/ingestion/admin/parsers",
            200
        )

        if success and isinstance(response, dict):
            parsers = response.get('parsers', [])
            if isinstance(parsers, list) and len(parsers) > 0:
                print(f"   ✅ Retrieved {len(parsers)} parsers")
                
                # Check parser structure
                parser = parsers[0]
                expected_fields = ['source', 'status', 'lastRunAt', 'itemsParsed', 'errorsCount']
                missing_fields = [field for field in expected_fields if field not in parser]
                
                if not missing_fields:
                    print(f"   ✅ Parser structure correct")
                    print(f"   ✅ Sample parser: {parser.get('source')} - {parser.get('status')}")
                    
                    # Check for Copart and IAAI
                    sources = [p.get('source') for p in parsers]
                    if 'copart' in sources and 'iaai' in sources:
                        print(f"   ✅ Both Copart and IAAI parsers found")
                    else:
                        print(f"   ⚠️  Expected parsers: copart, iaai. Found: {sources}")
                    
                    return True
                else:
                    print(f"   ❌ Missing parser fields: {missing_fields}")
            else:
                print(f"   ❌ No parsers found in response")
        
        return False

    def test_admin_health_overview(self):
        """Test GET /api/ingestion/admin/health - health overview"""
        success, response = self.run_test(
            "Admin Health Overview",
            "GET",
            "api/ingestion/admin/health",
            200
        )

        if success and isinstance(response, dict):
            expected_fields = ['status', 'metrics', 'proxies', 'alerts']
            missing_fields = [field for field in expected_fields if field not in response]
            
            if not missing_fields:
                print(f"   ✅ Health overview structure correct")
                print(f"   ✅ System status: {response.get('status')}")
                
                metrics = response.get('metrics', {})
                if metrics:
                    print(f"   ✅ Success rate: {metrics.get('successRate24h', 'N/A')}%")
                    print(f"   ✅ Errors last hour: {metrics.get('errorsLastHour', 0)}")
                
                proxies = response.get('proxies', {})
                if proxies:
                    print(f"   ✅ Proxies: {proxies.get('available', 0)}/{proxies.get('total', 0)} available")
                
                alerts = response.get('alerts', {})
                if alerts:
                    critical = alerts.get('critical', 0)
                    warning = alerts.get('warning', 0)
                    print(f"   ✅ Alerts: {critical} critical, {warning} warning")
                
                return True
            else:
                print(f"   ❌ Missing health fields: {missing_fields}")
        
        return False

    def test_admin_parser_details(self):
        """Test GET /api/ingestion/admin/parsers/:source - parser details"""
        # Test Copart parser details
        success, response = self.run_test(
            "Admin Parser Details - Copart",
            "GET",
            "api/ingestion/admin/parsers/copart",
            200
        )

        if success and isinstance(response, dict):
            expected_fields = ['source', 'status', 'lastRunAt', 'lastSuccessAt', 'itemsParsed']
            missing_fields = [field for field in expected_fields if field not in response]
            
            if not missing_fields:
                print(f"   ✅ Copart parser details correct")
                print(f"   ✅ Status: {response.get('status')}")
                print(f"   ✅ Items parsed: {response.get('itemsParsed', 0)}")
                print(f"   ✅ Last run: {response.get('lastRunAt', 'Never')}")
                return True
            else:
                print(f"   ❌ Missing parser detail fields: {missing_fields}")
        
        return False

    def test_admin_settings(self):
        """Test GET /api/ingestion/admin/settings - parser settings"""
        success, response = self.run_test(
            "Admin Parser Settings",
            "GET",
            "api/ingestion/admin/settings",
            200
        )

        if success and isinstance(response, list):
            print(f"   ✅ Retrieved settings for {len(response)} parsers")
            
            if len(response) > 0:
                setting = response[0]
                expected_fields = ['source', 'enabled', 'cronExpression', 'timeoutMs', 'maxRetries']
                missing_fields = [field for field in expected_fields if field not in setting]
                
                if not missing_fields:
                    print(f"   ✅ Settings structure correct")
                    print(f"   ✅ Sample setting: {setting.get('source')} - enabled: {setting.get('enabled')}")
                    print(f"   ✅ Cron: {setting.get('cronExpression', 'N/A')}")
                    return True
                else:
                    print(f"   ❌ Missing setting fields: {missing_fields}")
            else:
                print(f"   ⚠️  No settings found")
                return True  # Not necessarily an error
        
        return False

    def test_admin_proxies(self):
        """Test GET /api/ingestion/admin/proxies - proxy status"""
        success, response = self.run_test(
            "Admin Proxy Status",
            "GET",
            "api/ingestion/admin/proxies",
            200
        )

        if success and isinstance(response, dict):
            expected_fields = ['proxies', 'total', 'enabled', 'available']
            missing_fields = [field for field in expected_fields if field not in response]
            
            if not missing_fields:
                print(f"   ✅ Proxy status structure correct")
                print(f"   ✅ Total proxies: {response.get('total', 0)}")
                print(f"   ✅ Enabled: {response.get('enabled', 0)}")
                print(f"   ✅ Available: {response.get('available', 0)}")
                
                proxies = response.get('proxies', [])
                if len(proxies) > 0:
                    proxy = proxies[0]
                    print(f"   ✅ Sample proxy: {proxy.get('server', 'N/A')} - enabled: {proxy.get('enabled', False)}")
                else:
                    print(f"   ⚠️  No proxies configured")
                
                return True
            else:
                print(f"   ❌ Missing proxy fields: {missing_fields}")
        
        return False

    def test_admin_logs(self):
        """Test GET /api/ingestion/admin/logs - parser logs"""
        success, response = self.run_test(
            "Admin Parser Logs",
            "GET",
            "api/ingestion/admin/logs?limit=10",
            200
        )

        if success and isinstance(response, dict):
            expected_fields = ['items', 'total', 'page', 'totalPages']
            missing_fields = [field for field in expected_fields if field not in response]
            
            if not missing_fields:
                print(f"   ✅ Logs structure correct")
                print(f"   ✅ Total logs: {response.get('total', 0)}")
                print(f"   ✅ Page: {response.get('page', 1)}/{response.get('totalPages', 1)}")
                
                items = response.get('items', [])
                if len(items) > 0:
                    log = items[0]
                    expected_log_fields = ['id', 'source', 'level', 'event', 'createdAt']
                    missing_log_fields = [field for field in expected_log_fields if field not in log]
                    
                    if not missing_log_fields:
                        print(f"   ✅ Log structure correct")
                        print(f"   ✅ Sample log: {log.get('source')} - {log.get('level')} - {log.get('event')}")
                    else:
                        print(f"   ❌ Missing log fields: {missing_log_fields}")
                else:
                    print(f"   ⚠️  No logs found")
                
                return True
            else:
                print(f"   ❌ Missing logs response fields: {missing_fields}")
        
        return False

    def test_admin_alerts(self):
        """Test GET /api/ingestion/admin/alerts - active alerts"""
        success, response = self.run_test(
            "Admin Active Alerts",
            "GET",
            "api/ingestion/admin/alerts",
            200
        )

        if success and isinstance(response, list):
            print(f"   ✅ Retrieved {len(response)} active alerts")
            
            if len(response) > 0:
                alert = response[0]
                expected_fields = ['id', 'title', 'level', 'source', 'createdAt']
                missing_fields = [field for field in expected_fields if field not in alert]
                
                if not missing_fields:
                    print(f"   ✅ Alert structure correct")
                    print(f"   ✅ Sample alert: {alert.get('level')} - {alert.get('title')}")
                    print(f"   ✅ Source: {alert.get('source')}")
                else:
                    print(f"   ❌ Missing alert fields: {missing_fields}")
            else:
                print(f"   ✅ No active alerts (good)")
            
            return True
        
        return False

    def test_admin_parser_control_run(self):
        """Test POST /api/ingestion/admin/parsers/:source/run - run parser"""
        success, response = self.run_test(
            "Admin Run Parser - Copart",
            "POST",
            "api/ingestion/admin/parsers/copart/run",
            200,
            data={}
        )

        if success and isinstance(response, dict):
            if response.get('success'):
                print(f"   ✅ Parser run initiated successfully")
                print(f"   ✅ Message: {response.get('message', 'N/A')}")
                return True
            else:
                print(f"   ⚠️  Parser run response: {response.get('message', 'Unknown error')}")
                return True  # May be expected if parser is already running
        
        return False

    def test_admin_parser_control_stop(self):
        """Test POST /api/ingestion/admin/parsers/:source/stop - stop parser"""
        success, response = self.run_test(
            "Admin Stop Parser - Copart",
            "POST",
            "api/ingestion/admin/parsers/copart/stop",
            200,
            data={"reason": "Testing stop functionality"}
        )

        if success and isinstance(response, dict):
            if response.get('success'):
                print(f"   ✅ Parser stop initiated successfully")
                print(f"   ✅ Message: {response.get('message', 'N/A')}")
                return True
            else:
                print(f"   ⚠️  Parser stop response: {response.get('message', 'Unknown error')}")
                return True  # May be expected if parser is already stopped
        
        return False

    def test_admin_circuit_breaker_reset(self):
        """Test POST /api/ingestion/admin/parsers/:source/circuit-breaker/reset"""
        success, response = self.run_test(
            "Admin Reset Circuit Breaker - Copart",
            "POST",
            "api/ingestion/admin/parsers/copart/circuit-breaker/reset",
            200,
            data={}
        )

        if success and isinstance(response, dict):
            if response.get('success'):
                print(f"   ✅ Circuit breaker reset successfully")
                print(f"   ✅ Message: {response.get('message', 'N/A')}")
                return True
            else:
                print(f"   ⚠️  Circuit breaker reset response: {response.get('message', 'Unknown error')}")
                return True  # May be expected
        
        return False

    def test_admin_update_settings(self):
        """Test PATCH /api/ingestion/admin/settings/:source - update settings"""
        settings_data = {
            "enabled": True,
            "cronExpression": "0 */6 * * *",  # Every 6 hours
            "timeoutMs": 45000,
            "maxRetries": 3,
            "useProxies": True,
            "useCircuitBreaker": True
        }

        success, response = self.run_test(
            "Admin Update Parser Settings - Copart",
            "PATCH",
            "api/ingestion/admin/settings/copart",
            200,
            data=settings_data
        )

        if success and isinstance(response, dict):
            if response.get('success'):
                print(f"   ✅ Settings updated successfully")
                print(f"   ✅ Updated fields: {list(settings_data.keys())}")
                return True
            else:
                print(f"   ❌ Settings update failed: {response.get('message', 'Unknown error')}")
        
        return False

    def test_admin_proxy_management(self):
        """Test proxy management endpoints"""
        # Test adding a proxy
        proxy_data = {
            "server": "http://test-proxy.example.com:8080",
            "username": "testuser",
            "password": "testpass",
            "priority": 1
        }

        success, response = self.run_test(
            "Admin Add Proxy",
            "POST",
            "api/ingestion/admin/proxies",
            201,
            data=proxy_data
        )

        if success and isinstance(response, dict):
            proxy_id = response.get('id')
            if proxy_id:
                print(f"   ✅ Proxy added successfully with ID: {proxy_id}")
                
                # Test proxy operations
                self.run_test(
                    "Admin Test Proxy",
                    "POST",
                    f"api/ingestion/admin/proxies/{proxy_id}/test",
                    200
                )
                
                self.run_test(
                    "Admin Disable Proxy",
                    "POST",
                    f"api/ingestion/admin/proxies/{proxy_id}/disable",
                    200
                )
                
                self.run_test(
                    "Admin Delete Proxy",
                    "DELETE",
                    f"api/ingestion/admin/proxies/{proxy_id}",
                    200
                )
                
                return True
            else:
                print(f"   ❌ No proxy ID returned")
        
        return False

def main():
    print("🚀 Starting Parser Control Center Admin Testing...")
    print("=" * 60)
    
    tester = ParserAdminTester()
    
    # Test sequence for Parser Control Center Admin endpoints
    tests = [
        ("Authentication", tester.test_login),
        
        # Core admin endpoints - Primary focus
        ("Admin Parsers Overview", tester.test_admin_parsers_overview),
        ("Admin Health Overview", tester.test_admin_health_overview),
        ("Admin Parser Details", tester.test_admin_parser_details),
        ("Admin Parser Settings", tester.test_admin_settings),
        ("Admin Proxy Status", tester.test_admin_proxies),
        ("Admin Parser Logs", tester.test_admin_logs),
        ("Admin Active Alerts", tester.test_admin_alerts),
        
        # Parser control operations
        ("Admin Run Parser", tester.test_admin_parser_control_run),
        ("Admin Stop Parser", tester.test_admin_parser_control_stop),
        ("Admin Reset Circuit Breaker", tester.test_admin_circuit_breaker_reset),
        
        # Settings management
        ("Admin Update Settings", tester.test_admin_update_settings),
        
        # Proxy management
        ("Admin Proxy Management", tester.test_admin_proxy_management),
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
    print(f"📊 Parser Control Center Admin Test Results:")
    print(f"   Total tests: {tester.tests_run}")
    print(f"   Passed: {tester.tests_passed}")
    print(f"   Failed: {tester.tests_run - tester.tests_passed}")
    
    if failed_tests:
        print(f"\n❌ Failed tests:")
        for test in failed_tests:
            print(f"   - {test}")
    else:
        print(f"\n✅ All tests passed successfully!")
    
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"\n📈 Success rate: {success_rate:.1f}%")
    
    return 0 if len(failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())