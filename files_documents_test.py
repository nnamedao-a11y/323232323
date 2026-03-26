#!/usr/bin/env python3
import requests
import sys
import json
import io
from datetime import datetime

class FilesDocumentsAPITester:
    def __init__(self, base_url="https://inclusive-design-4.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.uploaded_file_id = None
        self.created_document_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)
        
        # Don't set Content-Type for file uploads
        if not files and 'Content-Type' not in test_headers:
            test_headers['Content-Type'] = 'application/json'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=15)
            elif method == 'POST':
                if files:
                    response = requests.post(url, data=data, files=files, headers=test_headers, timeout=15)
                else:
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

    def test_file_upload(self):
        """Test POST /api/files/upload - завантаження файлів"""
        # Create a test file
        test_content = b"This is a test document for CRM Files module testing."
        test_file = io.BytesIO(test_content)
        
        files = {
            'file': ('test_document.txt', test_file, 'text/plain')
        }
        
        data = {
            'entityType': 'document',
            'access': 'private',
            'note': 'Test file upload for Files + Documents module'
        }
        
        success, response = self.run_test(
            "File Upload",
            "POST",
            "api/files/upload",
            201,
            data=data,
            files=files
        )
        
        if success and isinstance(response, dict):
            file_id = response.get('id')
            if file_id:
                self.uploaded_file_id = file_id
                print(f"   ✅ File uploaded with ID: {file_id}")
                print(f"   ✅ Filename: {response.get('filename')}")
                print(f"   ✅ Size: {response.get('size')} bytes")
                return True
        
        return success

    def test_get_file(self):
        """Test GET /api/files/:id - отримання файлу"""
        if not self.uploaded_file_id:
            print("   ⚠️  No file ID available for get test")
            return False
        
        success, response = self.run_test(
            "Get File by ID",
            "GET",
            f"api/files/{self.uploaded_file_id}",
            200
        )
        
        if success and isinstance(response, dict):
            print(f"   ✅ File retrieved: {response.get('originalName')}")
            print(f"   ✅ MIME type: {response.get('mimeType')}")
            print(f"   ✅ Storage provider: {response.get('storageProvider')}")
        
        return success

    def test_get_file_signed_url(self):
        """Test GET /api/files/:id/url - signed URL для файлу"""
        if not self.uploaded_file_id:
            print("   ⚠️  No file ID available for signed URL test")
            return False
        
        success, response = self.run_test(
            "Get File Signed URL",
            "GET",
            f"api/files/{self.uploaded_file_id}/url?expiresIn=3600",
            200
        )
        
        if success and isinstance(response, dict):
            url = response.get('url')
            expires_in = response.get('expiresIn')
            if url:
                print(f"   ✅ Signed URL received (expires in {expires_in}s)")
                print(f"   ✅ URL: {url[:50]}...")
                return True
        
        return success

    def test_create_document(self):
        """Test POST /api/documents - створення документа"""
        document_data = {
            "type": "contract",
            "title": f"Test Contract {datetime.now().strftime('%H%M%S')}",
            "description": "Test contract document for Files + Documents module testing",
            "customerId": "test-customer-123",
            "fileIds": [self.uploaded_file_id] if self.uploaded_file_id else []
        }
        
        success, response = self.run_test(
            "Create Document",
            "POST",
            "api/documents",
            201,
            data=document_data
        )
        
        if success and isinstance(response, dict):
            doc_id = response.get('id')
            if doc_id:
                self.created_document_id = doc_id
                print(f"   ✅ Document created with ID: {doc_id}")
                print(f"   ✅ Title: {response.get('title')}")
                print(f"   ✅ Status: {response.get('status')}")
                print(f"   ✅ Type: {response.get('type')}")
                return True
        
        return success

    def test_get_document(self):
        """Test GET /api/documents/:id - отримання документа"""
        if not self.created_document_id:
            print("   ⚠️  No document ID available for get test")
            return False
        
        success, response = self.run_test(
            "Get Document by ID",
            "GET",
            f"api/documents/{self.created_document_id}",
            200
        )
        
        if success and isinstance(response, dict):
            print(f"   ✅ Document retrieved: {response.get('title')}")
            print(f"   ✅ Status: {response.get('status')}")
            print(f"   ✅ File IDs: {response.get('fileIds', [])}")
        
        return success

    def test_attach_files_to_document(self):
        """Test POST /api/documents/:id/attach-files - прикріплення файлів"""
        if not self.created_document_id:
            print("   ⚠️  No document ID available for attach files test")
            return False
        
        # Upload another test file first
        test_content = b"Additional test file for document attachment."
        test_file = io.BytesIO(test_content)
        
        files = {
            'file': ('additional_document.txt', test_file, 'text/plain')
        }
        
        data = {
            'entityType': 'document',
            'entityId': self.created_document_id,
            'note': 'Additional file for document'
        }
        
        upload_success, upload_response = self.run_test(
            "Upload Additional File",
            "POST",
            "api/files/upload",
            201,
            data=data,
            files=files
        )
        
        if not upload_success:
            return False
        
        additional_file_id = upload_response.get('id')
        if not additional_file_id:
            print("   ❌ No file ID in upload response")
            return False
        
        # Now attach the file to document
        attach_data = {
            "fileIds": [additional_file_id]
        }
        
        success, response = self.run_test(
            "Attach Files to Document",
            "POST",
            f"api/documents/{self.created_document_id}/attach-files",
            201,  # Changed from 200 to 201
            data=attach_data
        )
        
        if success and isinstance(response, dict):
            file_ids = response.get('fileIds', [])
            print(f"   ✅ Files attached. Total files: {len(file_ids)}")
            print(f"   ✅ Updated status: {response.get('status')}")
        
        return success

    def test_submit_for_verification(self):
        """Test POST /api/documents/:id/submit-for-verification - подання на перевірку"""
        if not self.created_document_id:
            print("   ⚠️  No document ID available for submit verification test")
            return False
        
        success, response = self.run_test(
            "Submit Document for Verification",
            "POST",
            f"api/documents/{self.created_document_id}/submit-for-verification",
            201,  # Changed from 200 to 201
        )
        
        if success and isinstance(response, dict):
            status = response.get('status')
            print(f"   ✅ Document submitted for verification")
            print(f"   ✅ New status: {status}")
            if status == 'pending_verification':
                print(f"   ✅ Status transition successful: uploaded -> pending_verification")
            return True
        
        return success

    def test_get_pending_verification_queue(self):
        """Test GET /api/documents/queue/pending-verification - черга на перевірку"""
        success, response = self.run_test(
            "Get Pending Verification Queue",
            "GET",
            "api/documents/queue/pending-verification",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   ✅ Found {len(response)} documents in verification queue")
            if len(response) > 0:
                # Check if our document is in the queue
                our_doc = next((doc for doc in response if doc.get('id') == self.created_document_id), None)
                if our_doc:
                    print(f"   ✅ Our test document found in queue: {our_doc.get('title')}")
                else:
                    print(f"   ⚠️  Our test document not found in queue")
            return True
        
        return success

    def test_verify_document(self):
        """Test POST /api/documents/:id/verify - верифікація документа"""
        if not self.created_document_id:
            print("   ⚠️  No document ID available for verify test")
            return False
        
        verify_data = {
            "note": "Document verified during API testing"
        }
        
        success, response = self.run_test(
            "Verify Document",
            "POST",
            f"api/documents/{self.created_document_id}/verify",
            201,  # Changed from 200 to 201
            data=verify_data
        )
        
        if success and isinstance(response, dict):
            status = response.get('status')
            verified_by = response.get('verifiedBy')
            verified_at = response.get('verifiedAt')
            print(f"   ✅ Document verified successfully")
            print(f"   ✅ New status: {status}")
            print(f"   ✅ Verified by: {verified_by}")
            print(f"   ✅ Verified at: {verified_at}")
            if status == 'verified':
                print(f"   ✅ Status transition successful: pending_verification -> verified")
            return True
        
        return success

    def test_create_and_reject_document(self):
        """Test document rejection workflow"""
        # Create another document for rejection test
        document_data = {
            "type": "invoice",
            "title": f"Test Invoice for Rejection {datetime.now().strftime('%H%M%S')}",
            "description": "Test invoice document for rejection workflow",
            "customerId": "test-customer-456"
        }
        
        create_success, create_response = self.run_test(
            "Create Document for Rejection Test",
            "POST",
            "api/documents",
            201,
            data=document_data
        )
        
        if not create_success:
            return False
        
        reject_doc_id = create_response.get('id')
        if not reject_doc_id:
            print("   ❌ No document ID in create response")
            return False
        
        # Upload and attach a file first
        test_content = b"Rejection test file content."
        test_file = io.BytesIO(test_content)
        
        files = {
            'file': ('rejection_test.txt', test_file, 'text/plain')
        }
        
        data = {
            'entityType': 'document',
            'entityId': reject_doc_id
        }
        
        upload_success, upload_response = self.run_test(
            "Upload File for Rejection Test",
            "POST",
            "api/files/upload",
            201,
            data=data,
            files=files
        )
        
        if not upload_success:
            return False
        
        file_id = upload_response.get('id')
        
        # Attach file to document
        attach_data = {"fileIds": [file_id]}
        attach_success, _ = self.run_test(
            "Attach File for Rejection Test",
            "POST",
            f"api/documents/{reject_doc_id}/attach-files",
            201,
            data=attach_data
        )
        
        if not attach_success:
            return False
        
        # Submit for verification
        submit_success, _ = self.run_test(
            "Submit Document for Verification (Rejection Test)",
            "POST",
            f"api/documents/{reject_doc_id}/submit-for-verification",
            201  # Changed from 200 to 201
        )
        
        if not submit_success:
            return False
        
        # Reject the document
        reject_data = {
            "reason": "Document quality is insufficient for API testing purposes"
        }
        
        success, response = self.run_test(
            "Reject Document",
            "POST",
            f"api/documents/{reject_doc_id}/reject",
            201,  # Changed from 200 to 201
            data=reject_data
        )
        
        if success and isinstance(response, dict):
            status = response.get('status')
            rejection_reason = response.get('rejectionReason')
            print(f"   ✅ Document rejected successfully")
            print(f"   ✅ New status: {status}")
            print(f"   ✅ Rejection reason: {rejection_reason}")
            if status == 'rejected':
                print(f"   ✅ Status transition successful: pending_verification -> rejected")
            return True
        
        return success

    def test_delete_file(self):
        """Test DELETE /api/files/:id - видалення файлу"""
        if not self.uploaded_file_id:
            print("   ⚠️  No file ID available for delete test")
            return False
        
        success, response = self.run_test(
            "Delete File",
            "DELETE",
            f"api/files/{self.uploaded_file_id}",
            200
        )
        
        if success and isinstance(response, dict):
            if response.get('success'):
                print(f"   ✅ File deleted successfully")
                return True
        
        return success

    def test_document_status_transitions(self):
        """Test complete document status workflow"""
        print(f"\n📋 Testing Document Status Transitions:")
        print(f"   Expected flow: draft -> uploaded -> pending_verification -> verified/rejected")
        
        # Create document without files (should be draft)
        draft_doc_data = {
            "type": "client_document",
            "title": f"Status Transition Test {datetime.now().strftime('%H%M%S')}",
            "description": "Testing document status transitions",
            "customerId": "test-customer-789"
        }
        
        create_success, create_response = self.run_test(
            "Create Draft Document",
            "POST",
            "api/documents",
            201,
            data=draft_doc_data
        )
        
        if not create_success:
            return False
        
        transition_doc_id = create_response.get('id')
        initial_status = create_response.get('status')
        print(f"   ✅ Initial status: {initial_status}")
        
        # Upload file and attach to make it 'uploaded'
        test_content = b"Status transition test file content."
        test_file = io.BytesIO(test_content)
        
        files = {
            'file': ('status_test.txt', test_file, 'text/plain')
        }
        
        data = {
            'entityType': 'document',
            'entityId': transition_doc_id
        }
        
        upload_success, upload_response = self.run_test(
            "Upload File for Status Transition",
            "POST",
            "api/files/upload",
            201,
            data=data,
            files=files
        )
        
        if not upload_success:
            return False
        
        file_id = upload_response.get('id')
        
        # Attach file to document
        attach_data = {"fileIds": [file_id]}
        attach_success, attach_response = self.run_test(
            "Attach File for Status Transition",
            "POST",
            f"api/documents/{transition_doc_id}/attach-files",
            201,  # Changed from 200 to 201
            data=attach_data
        )
        
        if attach_success:
            uploaded_status = attach_response.get('status')
            print(f"   ✅ After file attachment: {uploaded_status}")
        
        # Submit for verification
        submit_success, submit_response = self.run_test(
            "Submit for Verification (Status Transition)",
            "POST",
            f"api/documents/{transition_doc_id}/submit-for-verification",
            201  # Changed from 200 to 201
        )
        
        if submit_success:
            pending_status = submit_response.get('status')
            print(f"   ✅ After submission: {pending_status}")
        
        # Verify document
        verify_data = {"note": "Status transition test verification"}
        verify_success, verify_response = self.run_test(
            "Verify Document (Status Transition)",
            "POST",
            f"api/documents/{transition_doc_id}/verify",
            201,  # Changed from 200 to 201
            data=verify_data
        )
        
        if verify_success:
            final_status = verify_response.get('status')
            print(f"   ✅ Final status: {final_status}")
        
        print(f"   📊 Status Transition Summary:")
        print(f"      1. Created: {initial_status}")
        print(f"      2. File attached: {uploaded_status if attach_success else 'FAILED'}")
        print(f"      3. Submitted: {pending_status if submit_success else 'FAILED'}")
        print(f"      4. Verified: {final_status if verify_success else 'FAILED'}")
        
        return create_success and upload_success and attach_success and submit_success and verify_success

def main():
    print("🚀 Запуск тестування Files + Documents Module API...")
    print("=" * 60)
    
    tester = FilesDocumentsAPITester()
    
    # Test sequence for Files + Documents Module
    tests = [
        ("Login", tester.test_login),
        ("File Upload", tester.test_file_upload),
        ("Get File by ID", tester.test_get_file),
        ("Get File Signed URL", tester.test_get_file_signed_url),
        ("Create Document", tester.test_create_document),
        ("Get Document by ID", tester.test_get_document),
        ("Attach Files to Document", tester.test_attach_files_to_document),
        ("Submit Document for Verification", tester.test_submit_for_verification),
        ("Get Pending Verification Queue", tester.test_get_pending_verification_queue),
        ("Verify Document", tester.test_verify_document),
        ("Create and Reject Document", tester.test_create_and_reject_document),
        ("Document Status Transitions", tester.test_document_status_transitions),
        ("Delete File", tester.test_delete_file),
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
    print(f"📊 Результати тестування Files + Documents Module:")
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