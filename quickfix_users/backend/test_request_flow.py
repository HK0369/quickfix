#!/usr/bin/env python3
"""
Test script to verify the request flow is working correctly
"""

import requests
import json

# Test configuration
USERS_API_BASE = "http://localhost:8001/api"
PROVIDERS_API_BASE = "http://localhost:8002/api/providers"

def test_send_request():
    """Test sending a service request"""
    print("Testing send request...")
    
    # Test data
    request_data = {
        "provider_id": "test_provider_id",
        "service_type": "fuel",
        "customer_name": "Test User",
        "emergency_contact": "1234567890",
        "user_email": "test@example.com",
        "vehicle_type": "car",
        "vehicle_model": "Test Car",
        "issue_description": "Out of fuel",
        "urgency_level": "normal",
        "additional_notes": "Test request",
        "fuel_type": "petrol",
        "fuel_amount": "10",
        "delivery_required": "yes"
    }
    
    try:
        response = requests.post(
            f"{USERS_API_BASE}/requests/send",
            headers={"Content-Type": "application/json"},
            json=request_data
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 201:
            print("✅ Send request test passed!")
            return response.json().get("request", {}).get("_id")
        else:
            print("❌ Send request test failed!")
            return None
            
    except Exception as e:
        print(f"❌ Error in send request test: {e}")
        return None

def test_get_user_requests():
    """Test getting user requests"""
    print("\nTesting get user requests...")
    
    try:
        response = requests.get(
            f"{USERS_API_BASE}/requests/user-requests?user_email=test@example.com"
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Get user requests test passed!")
            return True
        else:
            print("❌ Get user requests test failed!")
            return False
            
    except Exception as e:
        print(f"❌ Error in get user requests test: {e}")
        return False

def test_get_provider_requests():
    """Test getting provider requests"""
    print("\nTesting get provider requests...")
    
    try:
        response = requests.get(
            f"{PROVIDERS_API_BASE}/requests/provider-requests?provider_id=test_provider_id"
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Get provider requests test passed!")
            return True
        else:
            print("❌ Get provider requests test failed!")
            return False
            
    except Exception as e:
        print(f"❌ Error in get provider requests test: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting request flow tests...\n")
    
    # Test 1: Send a request
    request_id = test_send_request()
    
    if request_id:
        # Test 2: Get user requests
        test_get_user_requests()
        
        # Test 3: Get provider requests
        test_get_provider_requests()
    
    print("\n🏁 Request flow tests completed!")

if __name__ == "__main__":
    main() 