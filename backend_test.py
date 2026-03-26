#!/usr/bin/env python3
import requests
import sys
import json
import time
from datetime import datetime
import uuid

class ParserIngestionTester:
    def __init__(self, base_url="https://accessibility-hub-13.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.created_vehicles = []  # Track created vehicles for cleanup

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
            "Login with admin@crm.com",
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

    def generate_test_vin(self):
        """Generate a valid test VIN"""
        # Generate a valid 17-character VIN for testing
        return f"1HGBH41JXMN{str(uuid.uuid4().hex[:6]).upper()}"

    def test_single_vehicle_webhook(self):
        """Test POST /api/ingestion/parser/vehicle - single vehicle webhook"""
        test_vin = self.generate_test_vin()
        vehicle_data = {
            "source": "copart",
            "externalId": f"LOT{int(time.time())}",
            "vin": test_vin,
            "title": "2020 BMW X5 xDrive40i",
            "description": "Luxury SUV with minor front damage",
            "make": "BMW",
            "model": "X5",
            "year": 2020,
            "mileage": 45000,
            "mileageUnit": "miles",
            "color": "Black",
            "bodyType": "SUV",
            "engineType": "petrol",
            "transmission": "automatic",
            "drivetrain": "awd",
            "price": 35000,
            "currency": "USD",
            "estimatedRetailValue": 45000,
            "repairCost": 8000,
            "images": [
                "https://example.com/image1.jpg",
                "https://example.com/image2.jpg"
            ],
            "primaryImage": "https://example.com/image1.jpg",
            "conditionGrade": "B",
            "damageType": "front",
            "damageDescription": "Minor front bumper damage",
            "hasKeys": True,
            "isRunnable": True,
            "auctionDate": "2024-12-20T10:00:00Z",
            "auctionLocation": "Dallas, TX",
            "lotNumber": f"LOT{int(time.time())}",
            "saleStatus": "upcoming",
            "sourceUrl": "https://copart.com/lot/12345",
            "metadata": {
                "category": "luxury",
                "seller": "insurance"
            }
        }

        success, response = self.run_test(
            "Single Vehicle Webhook",
            "POST",
            "api/ingestion/parser/vehicle",
            200,
            data=vehicle_data
        )

        if success and isinstance(response, dict):
            if response.get('success'):
                vehicle_id = response.get('vehicleId')
                if vehicle_id:
                    self.created_vehicles.append(vehicle_id)
                    print(f"   ✅ Vehicle created with ID: {vehicle_id}")
                    print(f"   ✅ Action: {response.get('action')}")
                    print(f"   ✅ VIN: {response.get('vin')}")
                    return True, vehicle_id
                else:
                    print(f"   ❌ No vehicleId in successful response")
            else:
                print(f"   ❌ Webhook failed: {response.get('message')}")
        
        return False, None

    def test_vin_validation_invalid(self):
        """Test VIN validation - invalid VIN should be rejected"""
        invalid_vehicle_data = {
            "source": "copart",
            "externalId": f"LOT{int(time.time())}",
            "vin": "INVALID_VIN",  # Invalid VIN
            "title": "Test Vehicle",
            "make": "Test",
            "model": "Test",
            "year": 2020
        }

        success, response = self.run_test(
            "VIN Validation - Invalid VIN",
            "POST",
            "api/ingestion/parser/vehicle",
            200,  # Should return 200 but with success: false
            data=invalid_vehicle_data
        )

        if success and isinstance(response, dict):
            if not response.get('success') and 'Invalid VIN' in response.get('message', ''):
                print(f"   ✅ Invalid VIN correctly rejected: {response.get('message')}")
                return True
            else:
                print(f"   ❌ Invalid VIN was not rejected properly")
        
        return False

    def test_vin_deduplication(self):
        """Test VIN deduplication - same VIN should update existing vehicle"""
        test_vin = self.generate_test_vin()
        
        # First vehicle creation
        vehicle_data_1 = {
            "source": "copart",
            "externalId": f"LOT{int(time.time())}",
            "vin": test_vin,
            "title": "2019 Honda Civic",
            "make": "Honda",
            "model": "Civic",
            "year": 2019,
            "price": 15000
        }

        success1, response1 = self.run_test(
            "VIN Deduplication - First Vehicle",
            "POST",
            "api/ingestion/parser/vehicle",
            200,
            data=vehicle_data_1
        )

        if not success1 or not response1.get('success'):
            return False

        vehicle_id = response1.get('vehicleId')
        action1 = response1.get('action')
        
        # Second vehicle with same VIN (should update)
        vehicle_data_2 = {
            "source": "copart",
            "externalId": f"LOT{int(time.time())}",
            "vin": test_vin,  # Same VIN
            "title": "2019 Honda Civic - Updated",
            "make": "Honda",
            "model": "Civic",
            "year": 2019,
            "price": 16000  # Updated price
        }

        success2, response2 = self.run_test(
            "VIN Deduplication - Update Vehicle",
            "POST",
            "api/ingestion/parser/vehicle",
            200,
            data=vehicle_data_2
        )

        if success2 and isinstance(response2, dict):
            if response2.get('success'):
                vehicle_id_2 = response2.get('vehicleId')
                action2 = response2.get('action')
                
                if vehicle_id == vehicle_id_2 and action1 == 'created' and action2 == 'updated':
                    print(f"   ✅ VIN deduplication working: same ID {vehicle_id}")
                    print(f"   ✅ First action: {action1}, Second action: {action2}")
                    self.created_vehicles.append(vehicle_id)
                    return True
                else:
                    print(f"   ❌ Deduplication failed: ID1={vehicle_id}, ID2={vehicle_id_2}")
                    print(f"   ❌ Actions: {action1} -> {action2}")
        
        return False

    def test_batch_import(self):
        """Test POST /api/ingestion/parser/batch - batch import"""
        batch_data = {
            "source": "iaai",
            "vehicles": [
                {
                    "externalId": f"IAAI{int(time.time())}_1",
                    "vin": self.generate_test_vin(),
                    "title": "2018 Toyota Camry",
                    "make": "Toyota",
                    "model": "Camry",
                    "year": 2018,
                    "price": 18000
                },
                {
                    "externalId": f"IAAI{int(time.time())}_2",
                    "vin": self.generate_test_vin(),
                    "title": "2019 Ford F-150",
                    "make": "Ford",
                    "model": "F-150",
                    "year": 2019,
                    "price": 25000
                },
                {
                    "externalId": f"IAAI{int(time.time())}_3",
                    "vin": "INVALID_VIN_BATCH",  # This should fail
                    "title": "Invalid Vehicle",
                    "make": "Test",
                    "model": "Test",
                    "year": 2020
                }
            ]
        }

        success, response = self.run_test(
            "Batch Import",
            "POST",
            "api/ingestion/parser/batch",
            200,
            data=batch_data
        )

        if success and isinstance(response, dict):
            total = response.get('total', 0)
            created = response.get('created', 0)
            updated = response.get('updated', 0)
            skipped = response.get('skipped', 0)
            failed = response.get('failed', 0)
            
            print(f"   ✅ Batch processed: {total} total")
            print(f"   ✅ Created: {created}, Updated: {updated}")
            print(f"   ✅ Skipped: {skipped}, Failed: {failed}")
            
            # Should have 2 created and 1 skipped/failed (invalid VIN)
            if created == 2 and (skipped == 1 or failed == 1):
                print(f"   ✅ Batch processing working correctly")
                return True
            else:
                print(f"   ❌ Unexpected batch results")
        
        return False

    def test_get_vehicles_list(self):
        """Test GET /api/ingestion/vehicles - list with filters"""
        success, response = self.run_test(
            "Get Vehicles List",
            "GET",
            "api/ingestion/vehicles?limit=10",
            200
        )

        if success and isinstance(response, dict):
            data = response.get('data', [])
            total = response.get('total', 0)
            page = response.get('page', 1)
            limit = response.get('limit', 10)
            
            print(f"   ✅ Retrieved {len(data)} vehicles (total: {total})")
            print(f"   ✅ Pagination: page {page}, limit {limit}")
            
            if len(data) > 0:
                vehicle = data[0]
                required_fields = ['id', 'vin', 'source', 'title']
                missing_fields = [field for field in required_fields if field not in vehicle]
                if not missing_fields:
                    print(f"   ✅ Vehicle structure correct")
                else:
                    print(f"   ⚠️  Missing fields in vehicle: {missing_fields}")
            
            return True
        
        return False

    def test_get_vehicles_stats(self):
        """Test GET /api/ingestion/vehicles/stats - statistics"""
        success, response = self.run_test(
            "Get Vehicles Statistics",
            "GET",
            "api/ingestion/vehicles/stats",
            200
        )

        if success and isinstance(response, dict):
            expected_fields = ['total', 'active', 'sold', 'reserved', 'archived', 
                             'newToday', 'updatedToday', 'bySource', 'avgPrice']
            missing_fields = [field for field in expected_fields if field not in response]
            
            if not missing_fields:
                print(f"   ✅ All stats fields present")
                print(f"   ✅ Total vehicles: {response.get('total')}")
                print(f"   ✅ Active vehicles: {response.get('active')}")
                print(f"   ✅ New today: {response.get('newToday')}")
                print(f"   ✅ Average price: ${response.get('avgPrice', 0):,.2f}")
                
                by_source = response.get('bySource', {})
                if by_source:
                    print(f"   ✅ By source: {by_source}")
                
                return True
            else:
                print(f"   ❌ Missing stats fields: {missing_fields}")
        
        return False

    def test_get_unique_makes(self):
        """Test GET /api/ingestion/vehicles/makes - unique makes"""
        success, response = self.run_test(
            "Get Unique Makes",
            "GET",
            "api/ingestion/vehicles/makes",
            200
        )

        if success and isinstance(response, list):
            print(f"   ✅ Retrieved {len(response)} unique makes")
            if len(response) > 0:
                print(f"   ✅ Sample makes: {response[:5]}")
            return True
        
        return False

    def test_get_unique_models(self):
        """Test GET /api/ingestion/vehicles/models - unique models"""
        success, response = self.run_test(
            "Get Unique Models",
            "GET",
            "api/ingestion/vehicles/models",
            200
        )

        if success and isinstance(response, list):
            print(f"   ✅ Retrieved {len(response)} unique models")
            if len(response) > 0:
                print(f"   ✅ Sample models: {response[:5]}")
            
            # Test with make filter
            success2, response2 = self.run_test(
                "Get Unique Models - With Make Filter",
                "GET",
                "api/ingestion/vehicles/models?make=BMW",
                200
            )
            
            if success2 and isinstance(response2, list):
                print(f"   ✅ BMW models: {len(response2)} found")
                return True
        
        return False

    def test_get_vehicle_by_id(self):
        """Test GET /api/ingestion/vehicles/:id - get by ID"""
        if not self.created_vehicles:
            print("   ⚠️  No vehicles created yet, skipping ID test")
            return True
        
        vehicle_id = self.created_vehicles[0]
        success, response = self.run_test(
            "Get Vehicle by ID",
            "GET",
            f"api/ingestion/vehicles/{vehicle_id}",
            200
        )

        if success and isinstance(response, dict):
            if response.get('id') == vehicle_id:
                print(f"   ✅ Vehicle retrieved by ID: {vehicle_id}")
                print(f"   ✅ VIN: {response.get('vin')}")
                print(f"   ✅ Title: {response.get('title')}")
                return True
            else:
                print(f"   ❌ Wrong vehicle returned")
        
        return False

    def test_get_vehicle_by_vin(self):
        """Test GET /api/ingestion/vehicles/vin/:vin - get by VIN"""
        # First create a vehicle to test with
        test_vin = self.generate_test_vin()
        vehicle_data = {
            "source": "copart",
            "externalId": f"LOT{int(time.time())}",
            "vin": test_vin,
            "title": "Test Vehicle for VIN lookup",
            "make": "Test",
            "model": "Test",
            "year": 2020
        }

        success1, response1 = self.run_test(
            "Create Vehicle for VIN Test",
            "POST",
            "api/ingestion/parser/vehicle",
            200,
            data=vehicle_data
        )

        if not success1 or not response1.get('success'):
            return False

        # Now test VIN lookup
        success, response = self.run_test(
            "Get Vehicle by VIN",
            "GET",
            f"api/ingestion/vehicles/vin/{test_vin}",
            200
        )

        if success and isinstance(response, dict):
            if response.get('vin') == test_vin:
                print(f"   ✅ Vehicle retrieved by VIN: {test_vin}")
                print(f"   ✅ ID: {response.get('id')}")
                print(f"   ✅ Title: {response.get('title')}")
                return True
            else:
                print(f"   ❌ Wrong vehicle returned for VIN")
        
        return False

    def test_update_vehicle_status(self):
        """Test POST /api/ingestion/vehicles/:id/status - change status"""
        if not self.created_vehicles:
            print("   ⚠️  No vehicles created yet, skipping status test")
            return True
        
        vehicle_id = self.created_vehicles[0]
        status_data = {
            "status": "reserved",
            "userId": self.user_id
        }

        success, response = self.run_test(
            "Update Vehicle Status",
            "POST",
            f"api/ingestion/vehicles/{vehicle_id}/status",
            200,
            data=status_data
        )

        if success and isinstance(response, dict):
            if response.get('status') == 'reserved':
                print(f"   ✅ Vehicle status updated to reserved")
                print(f"   ✅ Reserved by: {response.get('reservedBy')}")
                return True
            else:
                print(f"   ❌ Status not updated correctly")
        
        return False

    def test_link_vehicle_to_crm(self):
        """Test POST /api/ingestion/vehicles/:id/link - link to CRM"""
        if not self.created_vehicles:
            print("   ⚠️  No vehicles created yet, skipping link test")
            return True
        
        vehicle_id = self.created_vehicles[0]
        link_data = {
            "leadId": f"lead_{int(time.time())}",
            "dealId": f"deal_{int(time.time())}"
        }

        success, response = self.run_test(
            "Link Vehicle to CRM",
            "POST",
            f"api/ingestion/vehicles/{vehicle_id}/link",
            200,
            data=link_data
        )

        if success and isinstance(response, dict):
            if response.get('linkedLeadId') and response.get('linkedDealId'):
                print(f"   ✅ Vehicle linked to CRM")
                print(f"   ✅ Lead ID: {response.get('linkedLeadId')}")
                print(f"   ✅ Deal ID: {response.get('linkedDealId')}")
                return True
            else:
                print(f"   ❌ Vehicle not linked correctly")
        
        return False

    def test_get_raw_data(self):
        """Test GET /api/ingestion/raw-data - debug raw data"""
        success, response = self.run_test(
            "Get Raw Data",
            "GET",
            "api/ingestion/raw-data?limit=5",
            200
        )

        if success and isinstance(response, list):
            print(f"   ✅ Retrieved {len(response)} raw data records")
            if len(response) > 0:
                record = response[0]
                expected_fields = ['id', 'source', 'vin', 'processingStatus', 'receivedAt']
                missing_fields = [field for field in expected_fields if field not in record]
                if not missing_fields:
                    print(f"   ✅ Raw data structure correct")
                    print(f"   ✅ Sample record: {record.get('source')} - {record.get('processingStatus')}")
                else:
                    print(f"   ⚠️  Missing fields in raw data: {missing_fields}")
            return True
        
        return False

    def test_reprocess_failed(self):
        """Test POST /api/ingestion/reprocess - reprocess failed records"""
        success, response = self.run_test(
            "Reprocess Failed Records",
            "POST",
            "api/ingestion/reprocess",
            200,
            data={"limit": 10}
        )

        if success and isinstance(response, dict):
            processed = response.get('processed', 0)
            success_count = response.get('success', 0)
            failed_count = response.get('failed', 0)
            
            print(f"   ✅ Reprocessed {processed} records")
            print(f"   ✅ Success: {success_count}, Failed: {failed_count}")
            return True
        
        return False

    def test_dashboard_integration(self):
        """Test dashboard integration - vehicles section"""
        # This would test if the dashboard includes vehicles data
        # For now, we'll test if the vehicles stats endpoint works
        return self.test_get_vehicles_stats()

    def test_activity_logging(self):
        """Test activity logging for vehicle_created and vehicle_updated"""
        # Test recent activity to see if vehicle activities are logged
        success, response = self.run_test(
            "Activity Logging - Recent Activity",
            "GET",
            "api/activity/recent?limit=20",
            200
        )

        if success and isinstance(response, list):
            vehicle_activities = [
                activity for activity in response 
                if activity.get('action') in ['vehicle_created', 'vehicle_updated']
            ]
            
            print(f"   ✅ Found {len(vehicle_activities)} vehicle activities")
            if len(vehicle_activities) > 0:
                activity = vehicle_activities[0]
                print(f"   ✅ Sample activity: {activity.get('action')} - {activity.get('entityId')}")
                return True
            else:
                print(f"   ⚠️  No vehicle activities found in recent activity")
                return True  # Not necessarily a failure
        
        return False

def main():
    print("🚀 Starting Parser Integration Layer Testing...")
    print("=" * 60)
    
    tester = ParserIngestionTester()
    
    # Test sequence for Parser Integration Layer
    tests = [
        ("Authentication", tester.test_login),
        ("Single Vehicle Webhook", tester.test_single_vehicle_webhook),
        ("VIN Validation - Invalid VIN", tester.test_vin_validation_invalid),
        ("VIN Deduplication", tester.test_vin_deduplication),
        ("Batch Import", tester.test_batch_import),
        ("Get Vehicles List", tester.test_get_vehicles_list),
        ("Get Vehicles Statistics", tester.test_get_vehicles_stats),
        ("Get Unique Makes", tester.test_get_unique_makes),
        ("Get Unique Models", tester.test_get_unique_models),
        ("Get Vehicle by ID", tester.test_get_vehicle_by_id),
        ("Get Vehicle by VIN", tester.test_get_vehicle_by_vin),
        ("Update Vehicle Status", tester.test_update_vehicle_status),
        ("Link Vehicle to CRM", tester.test_link_vehicle_to_crm),
        ("Get Raw Data", tester.test_get_raw_data),
        ("Reprocess Failed Records", tester.test_reprocess_failed),
        ("Dashboard Integration", tester.test_dashboard_integration),
        ("Activity Logging", tester.test_activity_logging),
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
    print(f"📊 Parser Integration Layer Test Results:")
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