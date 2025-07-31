# QuickFix Request System Implementation

## Overview
The request system allows users to send service requests to providers and enables providers to manage these requests through accept/reject/complete actions.

## User Request Forms

### 1. Fuel Delivery Request
**Fields captured:**
- Customer Name *
- Emergency Contact Number *
- Fuel Type Required * (petrol, diesel, cng, electric)
- Fuel Amount (Liters) *
- Vehicle Type * (car, bike, truck, bus, other)
- Delivery Required? (yes/no)
- Additional Notes

### 2. Towing Service Request
**Fields captured:**
- Customer Name *
- Emergency Contact Number *
- Vehicle Type * (car, bike, truck, bus, other)
- What's the problem? * (breakdown, accident, flat-tire, out-of-fuel, battery-dead, other)
- Where to tow? * (destination address)
- Vehicle Model
- Additional Notes

### 3. Garage Service Request
**Fields captured:**
- Customer Name *
- Emergency Contact Number *
- Vehicle Type * (car, bike, truck, bus, other)
- Service Required * (repair, maintenance, diagnostic, tire-change, oil-change, brake-service, battery-service, other)
- Describe the Problem * (detailed description)
- Vehicle Model
- Urgency Level (normal, urgent, emergency)
- Additional Notes

## Request Status Flow

### Status Types:
1. **pending** - Initial status when request is sent
2. **accepted** - Provider has accepted the request
3. **completed** - Provider has completed the service
4. **rejected** - Provider has rejected the request
5. **cancelled** - User has cancelled the request

### Status Transitions:
- `pending` → `accepted` (Provider action)
- `pending` → `rejected` (Provider action)
- `pending` → `cancelled` (User action)
- `accepted` → `completed` (Provider action)

## Provider Actions

### 1. Accept Request
- **Endpoint:** `PUT /api/providers/requests/{request_id}/accept`
- **Action:** Changes status from `pending` to `accepted`
- **UI:** "Accept Request" button appears for pending requests

### 2. Complete Request
- **Endpoint:** `PUT /api/providers/requests/{request_id}/complete`
- **Action:** Changes status from `accepted` to `completed`
- **UI:** "Mark as Completed" button appears for accepted requests

### 3. Reject Request
- **Endpoint:** `PUT /api/providers/requests/{request_id}/reject`
- **Action:** Changes status from `pending` to `rejected`
- **UI:** "Reject Request" button with reason modal for pending requests

## Database Schema

### Service Requests Collection
```javascript
{
  "_id": ObjectId,
  "provider_id": "string",
  "service_type": "fuel|towing|garage",
  "customer_name": "string",
  "emergency_contact": "string",
  "user_email": "string",
  "vehicle_type": "string",
  "vehicle_model": "string",
  "issue_description": "string",
  "urgency_level": "normal|urgent|emergency",
  "additional_notes": "string",
  "fuel_type": "string", // Only for fuel requests
  "fuel_amount": "string", // Only for fuel requests
  "delivery_required": "string", // Only for fuel requests
  "destination": "string", // Only for towing requests
  "service_type_detail": "string", // Only for garage requests
  "status": "pending|accepted|completed|rejected|cancelled",
  "rejection_reason": "string", // Only when rejected
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

## API Endpoints

### User Backend (Port 8001)
- `POST /api/requests/send` - Send service request
- `GET /api/requests/user-requests?user_email={email}` - Get user's requests
- `GET /api/requests/{request_id}` - Get specific request details
- `PUT /api/requests/{request_id}/cancel` - Cancel request

### Provider Backend (Port 8002)
- `GET /api/providers/requests/provider-requests?provider_id={id}` - Get provider's requests
- `GET /api/providers/requests/{request_id}` - Get specific request details
- `PUT /api/providers/requests/{request_id}/accept` - Accept request
- `PUT /api/providers/requests/{request_id}/complete` - Complete request
- `PUT /api/providers/requests/{request_id}/reject` - Reject request
- `GET /api/providers/requests/stats?provider_id={id}` - Get provider statistics

## Frontend Pages

### User Side
- **Dashboard:** Send requests via service forms
- **My Requests:** View and track all sent requests
  - Shows status, service type, vehicle info, contact details
  - Can cancel pending requests
  - Detailed modal view with all request information

### Provider Side
- **Service Requests:** View and manage incoming requests
  - Shows customer info, vehicle details, service requirements
  - Accept/Reject/Complete buttons based on status
  - Rejection reason modal
  - Statistics dashboard

## Key Features

### 1. Complete Form Data Capture
All form fields are properly captured and stored:
- Fuel requests: type, amount, delivery preference
- Towing requests: problem type, destination
- Garage requests: service type, problem description, urgency

### 2. Status Management
- Clear status flow with proper transitions
- Status-specific UI elements (buttons, colors)
- Status tracking for both users and providers

### 3. Provider Actions
- Accept requests with one click
- Complete requests when service is done
- Reject requests with reason
- All actions update status immediately

### 4. User Experience
- Real-time status updates
- Detailed request information
- Easy cancellation for pending requests
- Toast notifications for all actions

### 5. Data Integrity
- All form fields validated and stored
- Proper error handling
- Consistent data structure
- Email-based user identification

## Testing

Run the comprehensive test script:
```bash
cd quickfix_users/backend
python test_complete_request_flow.py
```

This will test:
- All form field capture
- Provider actions (accept/complete/reject)
- Request retrieval for both users and providers
- Status transitions
- Data integrity

## Usage Flow

1. **User sends request:**
   - Fills out service-specific form
   - All fields captured and sent to backend
   - Request stored with `pending` status

2. **Provider receives request:**
   - Views request in "Service Requests" page
   - Sees all customer details and requirements
   - Can accept, reject, or complete the request

3. **Status updates:**
   - User sees status changes in "My Requests"
   - Provider can track request progress
   - Both sides have real-time updates

## Security & Validation

- Email-based user identification
- Required field validation
- Proper error handling
- Status transition validation
- Input sanitization

This implementation provides a complete request management system with full form data capture, provider actions, and status tracking for both users and providers. 