#!/usr/bin/env python3
"""
Simple test script to verify the integration between users and providers services
"""

import requests
import json

def test_providers_endpoint():
    """Test the providers endpoint directly"""
    print("Testing providers endpoint...")
    try:
        response = requests.get(
            "http://localhost:8002/api/providers/services/providers",
            params={
                'service_type': 'fuel',
                'lat': 20.5937,
                'lng': 78.9629
            },
            timeout=10
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Found {len(data.get('services', []))} provider services")
            for service in data.get('services', []):
                print(f"  - {service.get('name')} ({service.get('type')}) - {service.get('distance', 0):.0f}m")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error testing providers endpoint: {e}")

def test_users_endpoint():
    """Test the users endpoint that combines both sources"""
    print("\nTesting users endpoint...")
    try:
        response = requests.get(
            "http://localhost:8001/api/services/nearby",
            params={
                'service_type': 'fuel',
                'lat': 20.5937,
                'lng': 78.9629
            },
            timeout=30
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            services = data.get('services', [])
            print(f"Found {len(services)} total services")
            
            osm_services = [s for s in services if s.get('source') == 'openstreetmap']
            provider_services = [s for s in services if s.get('source') == 'registered_provider']
            
            print(f"  - OpenStreetMap services: {len(osm_services)}")
            print(f"  - Registered providers: {len(provider_services)}")
            
            for service in services[:5]:  # Show first 5 services
                source = service.get('source', 'unknown')
                print(f"  - {service.get('name')} ({source}) - {service.get('distance', 0):.0f}m")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error testing users endpoint: {e}")

if __name__ == "__main__":
    print("Testing QuickFix Service Integration")
    print("=" * 40)
    
    test_providers_endpoint()
    test_users_endpoint()
    
    print("\nTest completed!") 