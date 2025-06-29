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
        self.tokens = {
            "client": None,
            "admin": None,
            "seller": None
        }
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
        response = requests.get(f"{self.base_url}/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        print("✅ Health check endpoint is working")
        
    def test_02_root_endpoint(self):
        """Test the root endpoint"""
        print("\n🔍 Testing root endpoint...")
        response = requests.get(f"{self.base_url}/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["message"], "Ledger Recovery API is running")
        print("✅ Root endpoint is working")
        
    def test_03_client_login(self):
        """Test client login endpoint"""
        print("\n🔍 Testing client login...")
        response = requests.post(
            f"{self.base_url}/api/client/login", 
            json=self.client_credentials
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("user", data)
        self.assertEqual(data["user"]["email"], "client@demo.com")
        print("✅ Client login endpoint is working")
        
    def test_04_admin_login(self):
        """Test admin login endpoint"""
        print("\n🔍 Testing admin login...")
        response = requests.post(
            f"{self.base_url}/api/admin/login", 
            json=self.admin_credentials
        )
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("user", data)
        print("✅ Admin login endpoint is working")
        
    def test_05_seller_login(self):
        """Test seller login endpoint"""
        print("\n🔍 Testing seller login...")
        response = requests.post(
            f"{self.base_url}/api/seller/login", 
            json=self.seller_credentials
        )
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("user", data)
        print("✅ Seller login endpoint is working")
        
    def test_06_auth_me(self):
        """Test auth/me endpoint without authentication"""
        print("\n🔍 Testing auth/me endpoint without authentication...")
        response = requests.get(f"{self.base_url}/api/auth/me")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["message"], "Not authenticated")
        print("✅ Auth/me endpoint is working")
        
    def test_07_database_connection(self):
        """Test database connection indirectly through API endpoints"""
        print("\n🔍 Testing database connection indirectly...")
        # This is a basic test - in a real scenario, we would test CRUD operations
        # Since we don't have full API implementation yet, we'll just check login
        response = requests.post(
            f"{self.base_url}/api/client/login", 
            json=self.client_credentials
        )
        self.assertEqual(response.status_code, 200)
        print("✅ Database connection appears to be working")

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
    
    # Run the tests
    runner = unittest.TextTestRunner(verbosity=2)
    runner.run(suite)

if __name__ == "__main__":
    run_tests()