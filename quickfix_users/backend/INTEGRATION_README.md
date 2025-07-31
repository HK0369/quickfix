# QuickFix Service Integration

This document describes the integration between the users' and providers' services in the QuickFix roadside assistance platform.

## Overview

The users' service search now combines data from two sources:
1. **OpenStreetMap (OSM)** - Public services from the Overpass API
2. **Registered Providers** - Services from providers who have registered through the QuickFix platform

## How It Works

### 1. Provider Registration
- Providers register through the providers' portal (`quickfix_providers`)
- They set up their business details, location, and service type
- Their information is stored in the MongoDB database

### 2. Service Discovery
When users search for services (fuel, towing, garage), the system:

1. **Fetches from OpenStreetMap**: Uses the Overpass API to find public services
2. **Fetches from Registered Providers**: Queries the providers' database for registered services
3. **Combines and Sorts**: Merges both sources and sorts by distance
4. **Displays Results**: Shows services with source badges ("Verified Provider" vs "Public Service")

### 3. API Endpoints

#### Providers API (Port 8002)
- `GET /api/providers/services/providers?service_type=fuel&lat=20.5937&lng=78.9629`
- Returns registered providers for a specific service type

#### Users API (Port 8001)
- `GET /api/services/nearby?service_type=fuel&lat=20.5937&lng=78.9629`
- Returns combined services from both OSM and registered providers

## Service Data Structure

### OpenStreetMap Services
```json
{
  "id": "osm_123456",
  "name": "Shell Petrol Station",
  "type": "fuel",
  "location": {"lat": 20.5937, "lng": 78.9629},
  "distance": 1500,
  "phone": "+91-1234567890",
  "source": "openstreetmap"
}
```

### Registered Provider Services
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "QuickFuel Station",
  "type": "fuel",
  "location": {"lat": 20.5937, "lng": 78.9629},
  "distance": 1200,
  "phone": "+91-9876543210",
  "address": "123 Main Street",
  "services": "Petrol, Diesel, CNG",
  "working_hours": "24/7",
  "source": "registered_provider"
}
```

## Frontend Display

### Service List
- Services are displayed in a table with source badges
- "Verified Provider" badge (green) for registered providers
- "Public Service" badge (gray) for OSM services

### Service Details
- Clicking "Show Details" opens a sidebar with full information
- Registered providers show additional details like services offered and working hours
- Both types support calling and getting directions

## Testing

Run the test script to verify the integration:

```bash
cd quickfix_users/backend
python test_integration.py
```

## Setup Requirements

1. **Providers Server**: Must be running on port 8002
2. **Users Server**: Must be running on port 8001
3. **MongoDB**: Must be running and accessible
4. **Network**: Both servers must be able to communicate

## Error Handling

- If the providers' API is unavailable, the system continues to work with only OSM data
- If OSM API is unavailable, the system continues to work with only registered providers
- Network timeouts are handled gracefully
- Users see appropriate error messages if services cannot be fetched

## Future Enhancements

- Add provider ratings and reviews
- Implement real-time availability status
- Add service booking functionality
- Implement push notifications for service requests 