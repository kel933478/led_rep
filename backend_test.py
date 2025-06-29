import requests
import unittest
import json
import os
from datetime import datetime

class LedgerRecuperationAPITest(unittest.TestCase):
    def __init__(self, *args, **kwargs):
        super(LedgerRecuperationAPITest, self).__init__(*args, **kwargs)
        # Get the backend URL from environment or use default
        self.base_url = "http://localhost:8001"
        self.session = requests.Session()
        self.test_timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        
    def setUp(self):
        # Setup test data
        self.client_credentials = {
            "email": "client@demo.com",
            "password": "demo123"
        }
        self.admin_credentials = {
            "email": "admin@ledger.com",
            "password": "admin123"
        }
        self.seller_credentials = {
            "email": "vendeur@demo.com",
            "password": "vendeur123"
        }
        
    def test_01_health_check(self):
        """Test the health check endpoint"""
        print("\n🔍 Testing health check endpoint...")
        response = self.session.get(f"{self.base_url}/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        print("✅ Health check endpoint is working")
        
    def test_02_root_endpoint(self):
        """Test the root endpoint"""
        print("\n🔍 Testing root endpoint...")
        response = self.session.get(f"{self.base_url}/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["message"], "Ledger Recovery API is running")
        print("✅ Root endpoint is working")
        
    def test_03_client_login(self):
        """Test client login endpoint"""
        print("\n🔍 Testing client login...")
        response = self.session.post(
            f"{self.base_url}/api/client/login", 
            json=self.client_credentials
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("user", data)
        self.assertEqual(data["user"]["email"], "client@demo.com")
        print("✅ Client login endpoint is working")
        
        # Test client dashboard after login
        print("\n🔍 Testing client dashboard...")
        response = self.session.get(f"{self.base_url}/api/client/dashboard")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("client", data)
        self.assertIn("cryptoPrices", data)
        print("✅ Client dashboard endpoint is working")
        
        # Test client auth/me after login
        print("\n🔍 Testing auth/me endpoint with client authentication...")
        response = self.session.get(f"{self.base_url}/api/auth/me")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("user", data)
        self.assertEqual(data["user"]["type"], "client")
        print("✅ Auth/me endpoint with client authentication is working")
        
        # Test client logout
        print("\n🔍 Testing client logout...")
        response = self.session.post(f"{self.base_url}/api/auth/logout")
        self.assertEqual(response.status_code, 200)
        print("✅ Client logout endpoint is working")
        
    def test_04_admin_login(self):
        """Test admin login endpoint"""
        print("\n🔍 Testing admin login...")
        response = self.session.post(
            f"{self.base_url}/api/admin/login", 
            json=self.admin_credentials
        )
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("user", data)
        print("✅ Admin login endpoint is working")
        
        # Test admin dashboard after login
        print("\n🔍 Testing admin dashboard...")
        response = self.session.get(f"{self.base_url}/api/admin/dashboard")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("clients", data)
        self.assertIn("taxRate", data)
        print("✅ Admin dashboard endpoint is working")
        
        # Test admin auth/me after login
        print("\n🔍 Testing auth/me endpoint with admin authentication...")
        response = self.session.get(f"{self.base_url}/api/auth/me")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("user", data)
        self.assertEqual(data["user"]["type"], "admin")
        print("✅ Auth/me endpoint with admin authentication is working")
        
        # Test admin audit logs
        print("\n🔍 Testing admin audit logs...")
        response = self.session.get(f"{self.base_url}/api/admin/audit-logs")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("auditLogs", data)
        print("✅ Admin audit logs endpoint is working")
        
        # Test admin KYC documents
        print("\n🔍 Testing admin KYC documents...")
        response = self.session.get(f"{self.base_url}/api/admin/kyc/documents")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("documents", data)
        print("✅ Admin KYC documents endpoint is working")
        
        # Test admin wallets
        print("\n🔍 Testing admin wallets...")
        response = self.session.get(f"{self.base_url}/api/admin/wallets")
        self.assertEqual(response.status_code, 200)
        print("✅ Admin wallets endpoint is working")
        
        # Test admin crypto addresses
        print("\n🔍 Testing admin crypto addresses...")
        response = self.session.get(f"{self.base_url}/api/admin/crypto-addresses")
        self.assertEqual(response.status_code, 200)
        print("✅ Admin crypto addresses endpoint is working")
        
        # Test admin recovery requests
        print("\n🔍 Testing admin recovery requests...")
        response = self.session.get(f"{self.base_url}/api/admin/recovery/requests")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("requests", data)
        print("✅ Admin recovery requests endpoint is working")
        
        # Test admin pending taxes
        print("\n🔍 Testing admin pending taxes...")
        response = self.session.get(f"{self.base_url}/api/admin/taxes/pending")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("pendingTaxes", data)
        print("✅ Admin pending taxes endpoint is working")
        
        # If there are clients, test client-specific admin endpoints
        response = self.session.get(f"{self.base_url}/api/admin/dashboard")
        data = response.json()
        if data["clients"]:
            client_id = data["clients"][0]["id"]
            
            # Test admin client notes
            print(f"\n🔍 Testing admin client notes for client {client_id}...")
            response = self.session.get(f"{self.base_url}/api/admin/client/{client_id}/notes")
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIn("notes", data)
            print("✅ Admin client notes endpoint is working")
            
            # Test admin add client note
            print(f"\n🔍 Testing admin add client note for client {client_id}...")
            response = self.session.post(
                f"{self.base_url}/api/admin/client/{client_id}/notes",
                json={"note": f"Test note from API test {self.test_timestamp}"}
            )
            self.assertEqual(response.status_code, 200)
            print("✅ Admin add client note endpoint is working")
            
            # Test admin update client status
            print(f"\n🔍 Testing admin update client status for client {client_id}...")
            response = self.session.post(
                f"{self.base_url}/api/admin/client/{client_id}/status",
                json={"isActive": True}
            )
            self.assertEqual(response.status_code, 200)
            print("✅ Admin update client status endpoint is working")
            
            # Test admin update client risk
            print(f"\n🔍 Testing admin update client risk for client {client_id}...")
            response = self.session.post(
                f"{self.base_url}/api/admin/client/{client_id}/risk",
                json={"riskLevel": "medium"}
            )
            self.assertEqual(response.status_code, 200)
            print("✅ Admin update client risk endpoint is working")
            
            # Test admin update client balances
            print(f"\n🔍 Testing admin update client balances for client {client_id}...")
            new_balances = {
                "btc": 0.5,
                "eth": 2.5,
                "usdt": 5000,
                "ada": 1500,
                "dot": 25,
                "sol": 12,
                "link": 85,
                "matic": 2500,
                "bnb": 8.5,
                "xrp": 3200
            }
            response = self.session.post(
                f"{self.base_url}/api/admin/client/{client_id}/balances",
                json={"balances": new_balances}
            )
            self.assertEqual(response.status_code, 200)
            print("✅ Admin update client balances endpoint is working")
            
            # Test admin reset client password
            print(f"\n🔍 Testing admin reset client password for client {client_id}...")
            response = self.session.post(
                f"{self.base_url}/api/admin/client/{client_id}/reset-password"
            )
            self.assertEqual(response.status_code, 200)
            print("✅ Admin reset client password endpoint is working")
        
        # Test admin logout
        print("\n🔍 Testing admin logout...")
        response = self.session.post(f"{self.base_url}/api/auth/logout")
        self.assertEqual(response.status_code, 200)
        print("✅ Admin logout endpoint is working")
        
    def test_05_seller_login(self):
        """Test seller login endpoint"""
        print("\n🔍 Testing seller login...")
        response = self.session.post(
            f"{self.base_url}/api/seller/login", 
            json=self.seller_credentials
        )
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("user", data)
        print("✅ Seller login endpoint is working")
        
        # Test seller dashboard after login
        print("\n🔍 Testing seller dashboard...")
        response = self.session.get(f"{self.base_url}/api/seller/dashboard")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("seller", data)
        self.assertIn("assignedClients", data)
        print("✅ Seller dashboard endpoint is working")
        
        # Test seller auth/me after login
        print("\n🔍 Testing auth/me endpoint with seller authentication...")
        response = self.session.get(f"{self.base_url}/api/auth/me")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("user", data)
        self.assertEqual(data["user"]["type"], "seller")
        print("✅ Auth/me endpoint with seller authentication is working")
        
        # Test seller assigned clients
        print("\n🔍 Testing seller assigned clients...")
        response = self.session.get(f"{self.base_url}/api/seller/assigned-clients")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("assignedClients", data)
        print("✅ Seller assigned clients endpoint is working")
        
        # If there are assigned clients, test client-specific seller endpoints
        response = self.session.get(f"{self.base_url}/api/seller/dashboard")
        data = response.json()
        if data["assignedClients"]:
            client_id = data["assignedClients"][0]["id"]
            
            # Test seller update client amount
            print(f"\n🔍 Testing seller update client amount for client {client_id}...")
            response = self.session.patch(
                f"{self.base_url}/api/seller/client/{client_id}/amount",
                json={"amount": 50000}
            )
            self.assertEqual(response.status_code, 200)
            print("✅ Seller update client amount endpoint is working")
            
            # Test seller send payment message
            print(f"\n🔍 Testing seller send payment message for client {client_id}...")
            response = self.session.post(
                f"{self.base_url}/api/seller/client/{client_id}/payment-message",
                json={"message": f"Test payment message from API test {self.test_timestamp}"}
            )
            self.assertEqual(response.status_code, 200)
            print("✅ Seller send payment message endpoint is working")
        
        # Test seller logout
        print("\n🔍 Testing seller logout...")
        response = self.session.post(f"{self.base_url}/api/auth/logout")
        self.assertEqual(response.status_code, 200)
        print("✅ Seller logout endpoint is working")
        
    def test_06_auth_me(self):
        """Test auth/me endpoint without authentication"""
        print("\n🔍 Testing auth/me endpoint without authentication...")
        response = self.session.get(f"{self.base_url}/api/auth/me")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["message"], "Not authenticated")
        print("✅ Auth/me endpoint is working")
        
    def test_07_database_connection(self):
        """Test database connection indirectly through API endpoints"""
        print("\n🔍 Testing database connection indirectly...")
        # This is a basic test - in a real scenario, we would test CRUD operations
        # Since we don't have full API implementation yet, we'll just check login
        response = self.session.post(
            f"{self.base_url}/api/client/login", 
            json=self.client_credentials
        )
        self.assertEqual(response.status_code, 200)
        print("✅ Database connection appears to be working")
        
    def test_08_public_endpoints(self):
        """Test public endpoints"""
        print("\n🔍 Testing public crypto addresses endpoint...")
        response = self.session.get(f"{self.base_url}/api/crypto-addresses")
        self.assertEqual(response.status_code, 200)
        print("✅ Public crypto addresses endpoint is working")
        
        print("\n🔍 Testing recovery wallet endpoint...")
        recovery_data = {
            "email": f"test_{self.test_timestamp}@example.com",
            "walletType": "Bitcoin",
            "lastTransaction": "2023-12-01",
            "description": "Test recovery request",
            "contactInfo": "Test contact info"
        }
        response = self.session.post(
            f"{self.base_url}/api/recovery/wallet",
            json=recovery_data
        )
        self.assertEqual(response.status_code, 200)
        print("✅ Recovery wallet endpoint is working")
        
        print("\n🔍 Testing recovery seed phrase endpoint...")
        seed_data = {
            "email": f"test_{self.test_timestamp}@example.com",
            "partialWords": "word1 word2",
            "wordCount": 12,
            "approximateOrder": "Yes",
            "hints": "Test hints"
        }
        response = self.session.post(
            f"{self.base_url}/api/recovery/seed-phrase",
            json=seed_data
        )
        self.assertEqual(response.status_code, 200)
        print("✅ Recovery seed phrase endpoint is working")
        
        print("\n🔍 Testing recovery password endpoint...")
        password_data = {
            "email": f"test_{self.test_timestamp}@example.com",
            "passwordHints": "Test password hints",
            "variations": "Test variations",
            "contextInfo": "Test context info"
        }
        response = self.session.post(
            f"{self.base_url}/api/recovery/password",
            json=password_data
        )
        self.assertEqual(response.status_code, 200)
        print("✅ Recovery password endpoint is working")
        
        print("\n🔍 Testing client recovery request endpoint...")
        client_recovery_data = {
            "serviceType": "wallet",
            "clientName": f"Test Client {self.test_timestamp}",
            "clientEmail": f"test_{self.test_timestamp}@example.com",
            "phoneNumber": "+33123456789",
            "walletType": "Bitcoin",
            "problemDescription": "Test problem description",
            "urgencyLevel": "medium",
            "estimatedValue": 10000
        }
        response = self.session.post(
            f"{self.base_url}/api/client/recovery-request",
            json=client_recovery_data
        )
        self.assertEqual(response.status_code, 200)
        print("✅ Client recovery request endpoint is working")

def run_tests():
    # Create a test suite
    suite = unittest.TestSuite()
    
    # Add tests to the suite
    suite.addTest(LedgerRecuperationAPITest('test_01_health_check'))
    suite.addTest(LedgerRecuperationAPITest('test_02_root_endpoint'))
    suite.addTest(LedgerRecuperationAPITest('test_03_client_login'))
    suite.addTest(LedgerRecuperationAPITest('test_04_admin_login'))
    suite.addTest(LedgerRecuperationAPITest('test_05_seller_login'))
    suite.addTest(LedgerRecuperationAPITest('test_06_auth_me'))
    suite.addTest(LedgerRecuperationAPITest('test_07_database_connection'))
    suite.addTest(LedgerRecuperationAPITest('test_08_public_endpoints'))
    
    # Run the tests
    runner = unittest.TextTestRunner(verbosity=2)
    runner.run(suite)

if __name__ == "__main__":
    run_tests()