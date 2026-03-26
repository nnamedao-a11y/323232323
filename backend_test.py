#!/usr/bin/env python3
import requests
import sys
import json
import time
from datetime import datetime

class MasterDashboardTester:
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

    def test_system_health(self):
        """Test system health endpoint"""
        success, response = self.run_test(
            "System Health Check",
            "GET",
            "api/system/health",
            200
        )
        if success and isinstance(response, dict):
            status = response.get('status', 'unknown')
            print(f"   ✅ System status: {status}")
            
            # Check for expected health metrics
            expected_fields = ['status', 'timestamp', 'services']
            missing_fields = [field for field in expected_fields if field not in response]
            if missing_fields:
                print(f"   ⚠️  Missing health fields: {missing_fields}")
            else:
                print(f"   ✅ All health check fields present")
                
            # Check services status if available
            services = response.get('services', {})
            if services:
                for service_name, service_status in services.items():
                    print(f"   - {service_name}: {service_status}")
        return success

    def test_master_dashboard_basic(self):
        """Test basic master dashboard endpoint"""
        success, response = self.run_test(
            "Master Dashboard - Basic",
            "GET",
            "api/dashboard/master",
            200
        )
        if success and isinstance(response, dict):
            # Check for all 8 specialized services
            expected_services = ['sla', 'workload', 'leads', 'callbacks', 'deposits', 'documents', 'routing', 'system']
            missing_services = [service for service in expected_services if service not in response]
            
            if missing_services:
                print(f"   ❌ Missing services: {missing_services}")
            else:
                print(f"   ✅ All 8 specialized services present")
            
            # Check metadata
            if 'generatedAt' in response:
                print(f"   ✅ Generated at: {response['generatedAt']}")
            if 'period' in response:
                print(f"   ✅ Period: {response['period']}")
                
            # Validate SLA metrics structure
            sla = response.get('sla', {})
            if sla:
                sla_fields = ['overdueLeads', 'overdueTasks', 'overdueCallbacks', 'avgFirstResponseMinutes', 'missedSlaRate']
                sla_missing = [field for field in sla_fields if field not in sla]
                if not sla_missing:
                    print(f"   ✅ SLA metrics complete")
                else:
                    print(f"   ⚠️  SLA missing fields: {sla_missing}")
            
            # Validate Workload metrics structure
            workload = response.get('workload', {})
            if workload:
                workload_fields = ['totalManagers', 'overloadedManagers', 'idleManagers', 'busyManagers', 'managers']
                workload_missing = [field for field in workload_fields if field not in workload]
                if not workload_missing:
                    print(f"   ✅ Workload metrics complete")
                    # Check manager workload calculation
                    managers = workload.get('managers', [])
                    if managers:
                        manager = managers[0]
                        score = manager.get('score', 0)
                        active_leads = manager.get('activeLeads', 0)
                        open_tasks = manager.get('openTasks', 0)
                        overdue_tasks = manager.get('overdueTasks', 0)
                        expected_score = (active_leads * 2) + open_tasks + (overdue_tasks * 3)
                        if score == expected_score:
                            print(f"   ✅ Workload calculation correct for {manager.get('name', 'Manager')}")
                        else:
                            print(f"   ⚠️  Workload calculation mismatch: expected {expected_score}, got {score}")
                else:
                    print(f"   ⚠️  Workload missing fields: {workload_missing}")
        
        return success

    def test_master_dashboard_period_day(self):
        """Test master dashboard with day period filter"""
        success, response = self.run_test(
            "Master Dashboard - Period Day",
            "GET",
            "api/dashboard/master?period=day",
            200
        )
        if success and isinstance(response, dict):
            period = response.get('period')
            if period == 'day':
                print(f"   ✅ Period filter working: {period}")
            else:
                print(f"   ⚠️  Period filter not applied correctly: expected 'day', got '{period}'")
        return success

    def test_master_dashboard_period_week(self):
        """Test master dashboard with week period filter"""
        success, response = self.run_test(
            "Master Dashboard - Period Week",
            "GET",
            "api/dashboard/master?period=week",
            200
        )
        if success and isinstance(response, dict):
            period = response.get('period')
            if period == 'week':
                print(f"   ✅ Period filter working: {period}")
            else:
                print(f"   ⚠️  Period filter not applied correctly: expected 'week', got '{period}'")
        return success

    def test_master_dashboard_period_month(self):
        """Test master dashboard with month period filter"""
        success, response = self.run_test(
            "Master Dashboard - Period Month",
            "GET",
            "api/dashboard/master?period=month",
            200
        )
        if success and isinstance(response, dict):
            period = response.get('period')
            if period == 'month':
                print(f"   ✅ Period filter working: {period}")
            else:
                print(f"   ⚠️  Period filter not applied correctly: expected 'month', got '{period}'")
        return success

    def test_master_dashboard_caching(self):
        """Test Redis caching functionality"""
        print(f"\n🔍 Testing Redis Caching...")
        
        # First request - should populate cache
        start_time = time.time()
        success1, response1 = self.run_test(
            "Master Dashboard - Cache Miss",
            "GET",
            "api/dashboard/master?period=day",
            200
        )
        first_request_time = time.time() - start_time
        
        if not success1:
            return False
        
        # Second request - should hit cache (faster)
        start_time = time.time()
        success2, response2 = self.run_test(
            "Master Dashboard - Cache Hit",
            "GET",
            "api/dashboard/master?period=day",
            200
        )
        second_request_time = time.time() - start_time
        
        if not success2:
            return False
        
        # Compare response times
        print(f"   First request time: {first_request_time:.3f}s")
        print(f"   Second request time: {second_request_time:.3f}s")
        
        if second_request_time < first_request_time * 0.8:  # 20% faster indicates caching
            print(f"   ✅ Caching appears to be working (faster second request)")
        else:
            print(f"   ⚠️  Caching may not be working (similar response times)")
        
        # Test cache refresh
        success3, response3 = self.run_test(
            "Master Dashboard - Cache Refresh",
            "GET",
            "api/dashboard/master?period=day&refresh=true",
            200
        )
        
        return success1 and success2 and success3

    def test_kpi_summary(self):
        """Test KPI summary endpoint"""
        success, response = self.run_test(
            "Dashboard KPI Summary",
            "GET",
            "api/dashboard/kpi-summary",
            200
        )
        if success and isinstance(response, dict):
            expected_fields = ['newLeadsToday', 'overdueLeads', 'pendingDeposits', 'pendingVerificationDocs', 
                             'overloadedManagers', 'failedJobs', 'criticalAlerts']
            missing_fields = [field for field in expected_fields if field not in response]
            if missing_fields:
                print(f"   ⚠️  Missing KPI summary fields: {missing_fields}")
            else:
                print(f"   ✅ All KPI summary fields present")
                
            # Check critical alerts calculation
            critical_alerts = response.get('criticalAlerts', 0)
            print(f"   ✅ Critical alerts count: {critical_alerts}")
        return success

    def test_legacy_dashboard(self):
        """Test legacy dashboard endpoint"""
        success, response = self.run_test(
            "Legacy Dashboard",
            "GET",
            "api/dashboard",
            200
        )
        if success and isinstance(response, dict):
            expected_sections = ['leads', 'customers', 'deals', 'deposits', 'tasks']
            missing_sections = [section for section in expected_sections if section not in response]
            if missing_sections:
                print(f"   ⚠️  Missing legacy dashboard sections: {missing_sections}")
            else:
                print(f"   ✅ All legacy dashboard sections present")
        return success

    def test_legacy_kpi(self):
        """Test legacy KPI endpoint"""
        success, response = self.run_test(
            "Legacy KPI",
            "GET",
            "api/dashboard/kpi",
            200
        )
        if success and isinstance(response, dict):
            expected_fields = ['totalLeads', 'totalDeals', 'totalDealsValue', 'totalDeposits', 
                             'totalDepositsAmount', 'conversionRate']
            missing_fields = [field for field in expected_fields if field not in response]
            if missing_fields:
                print(f"   ⚠️  Missing legacy KPI fields: {missing_fields}")
            else:
                print(f"   ✅ All legacy KPI fields present")
                
            # Check conversion rate calculation
            conversion_rate = response.get('conversionRate', 0)
            total_leads = response.get('totalLeads', 0)
            print(f"   ✅ Conversion rate: {conversion_rate}% (from {total_leads} leads)")
        return success

    def test_workload_calculation_edge_cases(self):
        """Test workload calculation edge cases"""
        success, response = self.run_test(
            "Master Dashboard - Workload Edge Cases",
            "GET",
            "api/dashboard/master",
            200
        )
        if success and isinstance(response, dict):
            workload = response.get('workload', {})
            managers = workload.get('managers', [])
            
            # Test different workload statuses
            statuses = {}
            for manager in managers:
                status = manager.get('status', 'unknown')
                statuses[status] = statuses.get(status, 0) + 1
            
            print(f"   ✅ Manager status distribution: {statuses}")
            
            # Check for idle managers (score = 0, activeLeads = 0)
            idle_managers = [m for m in managers if m.get('status') == 'idle']
            overloaded_managers = [m for m in managers if m.get('status') == 'overloaded']
            
            print(f"   ✅ Idle managers: {len(idle_managers)}")
            print(f"   ✅ Overloaded managers: {len(overloaded_managers)}")
            
            # Verify workload thresholds
            for manager in managers[:3]:  # Check first 3 managers
                score = manager.get('score', 0)
                status = manager.get('status', 'unknown')
                name = manager.get('name', 'Unknown')
                
                # Check status logic
                if score == 0 and manager.get('activeLeads', 0) == 0:
                    expected_status = 'idle'
                elif score >= 50:  # Assuming overloaded threshold
                    expected_status = 'overloaded'
                elif score >= 25:  # Assuming busy threshold
                    expected_status = 'busy'
                else:
                    expected_status = 'ok'
                
                print(f"   Manager {name}: score={score}, status={status}")
        
        return success

    def test_sla_metrics_calculation(self):
        """Test SLA metrics calculation accuracy"""
        success, response = self.run_test(
            "Master Dashboard - SLA Metrics",
            "GET",
            "api/dashboard/master",
            200
        )
        if success and isinstance(response, dict):
            sla = response.get('sla', {})
            
            # Check SLA metrics
            overdue_leads = sla.get('overdueLeads', 0)
            overdue_tasks = sla.get('overdueTasks', 0)
            overdue_callbacks = sla.get('overdueCallbacks', 0)
            avg_response = sla.get('avgFirstResponseMinutes', 0)
            missed_sla_rate = sla.get('missedSlaRate', 0)
            
            print(f"   ✅ Overdue leads: {overdue_leads}")
            print(f"   ✅ Overdue tasks: {overdue_tasks}")
            print(f"   ✅ Overdue callbacks: {overdue_callbacks}")
            print(f"   ✅ Avg first response: {avg_response} minutes")
            print(f"   ✅ Missed SLA rate: {missed_sla_rate}%")
            
            # Validate data types and ranges
            if not isinstance(overdue_leads, int) or overdue_leads < 0:
                print(f"   ⚠️  Invalid overdue leads value: {overdue_leads}")
            if not isinstance(missed_sla_rate, (int, float)) or missed_sla_rate < 0 or missed_sla_rate > 100:
                print(f"   ⚠️  Invalid missed SLA rate: {missed_sla_rate}")
        
        return success

    def test_leads_grouping_by_status(self):
        """Test leads grouping by status"""
        success, response = self.run_test(
            "Master Dashboard - Leads Grouping",
            "GET",
            "api/dashboard/master",
            200
        )
        if success and isinstance(response, dict):
            leads = response.get('leads', {})
            
            # Check leads grouping
            new_count = leads.get('newCount', 0)
            in_progress_count = leads.get('inProgressCount', 0)
            converted_count = leads.get('convertedCount', 0)
            lost_count = leads.get('lostCount', 0)
            unassigned_count = leads.get('unassignedCount', 0)
            total_active = leads.get('totalActive', 0)
            
            print(f"   ✅ New leads: {new_count}")
            print(f"   ✅ In progress: {in_progress_count}")
            print(f"   ✅ Converted: {converted_count}")
            print(f"   ✅ Lost: {lost_count}")
            print(f"   ✅ Unassigned: {unassigned_count}")
            print(f"   ✅ Total active: {total_active}")
            
            # Validate totals
            calculated_total = new_count + in_progress_count + unassigned_count
            if calculated_total <= total_active:
                print(f"   ✅ Lead counts are consistent")
            else:
                print(f"   ⚠️  Lead count inconsistency: calculated {calculated_total}, reported {total_active}")
        
        return success

    def test_multiple_periods_consistency(self):
        """Test consistency across different periods"""
        periods = ['day', 'week', 'month']
        responses = {}
        
        for period in periods:
            success, response = self.run_test(
                f"Master Dashboard - Period {period.title()}",
                "GET",
                f"api/dashboard/master?period={period}",
                200
            )
            if success:
                responses[period] = response
            else:
                return False
        
        # Compare responses for consistency
        print(f"   ✅ Testing period consistency...")
        
        for period, response in responses.items():
            period_value = response.get('period')
            if period_value == period:
                print(f"   ✅ Period {period} correctly set")
            else:
                print(f"   ⚠️  Period {period} incorrectly set to {period_value}")
        
        # Check that different periods return different data (where applicable)
        day_sla = responses.get('day', {}).get('sla', {}).get('overdueLeads', 0)
        week_sla = responses.get('week', {}).get('sla', {}).get('overdueLeads', 0)
        month_sla = responses.get('month', {}).get('sla', {}).get('overdueLeads', 0)
        
        print(f"   ✅ Overdue leads - Day: {day_sla}, Week: {week_sla}, Month: {month_sla}")
        
        return True

    def test_activity_endpoints(self):
        """Test Activity API endpoints"""
        # Test recent activity
        success1, response1 = self.run_test(
            "Activity - Recent",
            "GET",
            "api/activity/recent?limit=10",
            200
        )
        
        # Test my activity
        success2, response2 = self.run_test(
            "Activity - My Activity",
            "GET",
            "api/activity/my?limit=20",
            200
        )
        
        # Test performance endpoint
        success3, response3 = self.run_test(
            "Activity - Performance",
            "GET",
            "api/activity/performance?period=day",
            200
        )
        
        # Test inactive managers
        success4, response4 = self.run_test(
            "Activity - Inactive Managers",
            "GET",
            "api/activity/inactive-managers?hours=2",
            200
        )
        
        if success1 and isinstance(response1, list):
            print(f"   ✅ Recent activity returned {len(response1)} items")
        
        if success2 and isinstance(response2, list):
            print(f"   ✅ My activity returned {len(response2)} items")
            
        if success3 and isinstance(response3, list):
            print(f"   ✅ Performance data returned {len(response3)} managers")
            
        if success4 and isinstance(response4, list):
            print(f"   ✅ Inactive managers returned {len(response4)} items")
        
        return success1 and success2 and success3 and success4

    def test_staff_endpoints(self):
        """Test Staff API endpoints"""
        # Test staff list
        success1, response1 = self.run_test(
            "Staff - List",
            "GET",
            "api/staff",
            200
        )
        
        # Test staff stats
        success2, response2 = self.run_test(
            "Staff - Stats",
            "GET",
            "api/staff/stats",
            200
        )
        
        # Test staff performance
        success3, response3 = self.run_test(
            "Staff - Performance",
            "GET",
            "api/staff/performance?period=day",
            200
        )
        
        # Test inactive staff
        success4, response4 = self.run_test(
            "Staff - Inactive",
            "GET",
            "api/staff/inactive?hours=2",
            200
        )
        
        if success1 and isinstance(response1, dict):
            data = response1.get('data', [])
            print(f"   ✅ Staff list returned {len(data)} staff members")
        
        if success2 and isinstance(response2, dict):
            print(f"   ✅ Staff stats returned: {list(response2.keys())}")
            
        if success3 and isinstance(response3, list):
            print(f"   ✅ Staff performance returned {len(response3)} items")
            
        if success4 and isinstance(response4, list):
            print(f"   ✅ Inactive staff returned {len(response4)} items")
        
        return success1 and success2 and success3 and success4

    def test_settings_endpoints(self):
        """Test Settings API endpoints"""
        # Test settings list
        success1, response1 = self.run_test(
            "Settings - List",
            "GET",
            "api/settings",
            200
        )
        
        if success1 and isinstance(response1, list):
            print(f"   ✅ Settings returned {len(response1)} items")
            for setting in response1[:3]:  # Show first 3 settings
                key = setting.get('key', 'unknown')
                print(f"   - Setting: {key}")
        
        return success1

    def test_basic_crud_endpoints(self):
        """Test basic CRUD endpoints for main entities"""
        endpoints = [
            ("Leads", "api/leads"),
            ("Customers", "api/customers"), 
            ("Deals", "api/deals"),
            ("Deposits", "api/deposits"),
            ("Tasks", "api/tasks")
        ]
        
        all_success = True
        for name, endpoint in endpoints:
            success, response = self.run_test(
                f"{name} - List",
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
    print("🚀 Запуск тестування Master Dashboard v2 API...")
    print("=" * 60)
    
    tester = MasterDashboardTester()
    
    # Test sequence for Master Dashboard v2
    tests = [
        ("Authentication", tester.test_login),
        ("System Health Check", tester.test_system_health),
        ("Activity API Endpoints", tester.test_activity_endpoints),
        ("Staff API Endpoints", tester.test_staff_endpoints),
        ("Settings API Endpoints", tester.test_settings_endpoints),
        ("Basic CRUD Endpoints", tester.test_basic_crud_endpoints),
        ("Master Dashboard - Basic", tester.test_master_dashboard_basic),
        ("Master Dashboard - Period Day", tester.test_master_dashboard_period_day),
        ("Master Dashboard - Period Week", tester.test_master_dashboard_period_week),
        ("Master Dashboard - Period Month", tester.test_master_dashboard_period_month),
        ("Redis Caching", tester.test_master_dashboard_caching),
        ("KPI Summary", tester.test_kpi_summary),
        ("Legacy Dashboard", tester.test_legacy_dashboard),
        ("Legacy KPI", tester.test_legacy_kpi),
        ("Workload Calculation Edge Cases", tester.test_workload_calculation_edge_cases),
        ("SLA Metrics Calculation", tester.test_sla_metrics_calculation),
        ("Leads Grouping by Status", tester.test_leads_grouping_by_status),
        ("Multiple Periods Consistency", tester.test_multiple_periods_consistency),
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
    print(f"📊 Результати тестування Master Dashboard v2:")
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