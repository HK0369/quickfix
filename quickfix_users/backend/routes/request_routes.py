from flask import Blueprint, request, jsonify
from config import mongo
import datetime
from bson.objectid import ObjectId

request_bp = Blueprint('request_bp', __name__)

@request_bp.route('/send', methods=['POST'])
def send_service_request():
    """Send a service request to a provider"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['provider_id', 'service_type', 'customer_name', 'emergency_contact', 'vehicle_type']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"{field} is required"}), 400
        
        # Create service request
        print(f"DEBUG: Received request data - user_email: {data.get('user_email')}")
        print(f"DEBUG: Full request data: {data}")
        print(f"DEBUG: Data type of user_email: {type(data.get('user_email'))}")
        print(f"DEBUG: Is user_email None? {data.get('user_email') is None}")
        print(f"DEBUG: Is user_email empty string? {data.get('user_email') == ''}")
        
        request_data = {
            "provider_id": data.get('provider_id'),
            "service_type": data.get('service_type'),
            "customer_name": data.get('customer_name'),
            "emergency_contact": data.get('emergency_contact'),
            "user_email": data.get('user_email'),
            "vehicle_type": data.get('vehicle_type'),
            "vehicle_model": data.get('vehicle_model', ''),
            "issue_description": data.get('issue_description', ''),
            "urgency_level": data.get('urgency_level', 'normal'),
            "additional_notes": data.get('additional_notes', ''),
            "fuel_type": data.get('fuel_type', ''),
            "fuel_amount": data.get('fuel_amount', ''),
            "delivery_required": data.get('delivery_required', ''),
            "destination": data.get('destination', ''),
            "service_type_detail": data.get('service_type_detail', ''),
            "status": "pending",  # pending, accepted, completed, cancelled, rejected
            "created_at": datetime.datetime.utcnow(),
            "updated_at": datetime.datetime.utcnow()
        }
        
        print(f"DEBUG: Request data to be saved: {request_data}")
        
        # Insert into database
        print(f"DEBUG: Inserting request into database...")
        request_id = mongo.db.service_requests.insert_one(request_data).inserted_id
        print(f"DEBUG: Request inserted with ID: {request_id}")
        
        # Get the created request
        created_request = mongo.db.service_requests.find_one({"_id": request_id})
        created_request['_id'] = str(created_request['_id'])
        print(f"DEBUG: Retrieved created request: {created_request}")
        
        return jsonify({
            "success": True,
            "message": "Service request sent successfully",
            "request": created_request
        }), 201
        
    except Exception as e:
        print(f"Error sending service request: {e}")
        return jsonify({"error": "Failed to send service request"}), 500

@request_bp.route('/user-requests', methods=['GET'])
def get_user_requests():
    """Get all requests sent by a user (identified by email)"""
    try:
        user_email = request.args.get('user_email')
        
        if not user_email:
            return jsonify({"error": "User email is required"}), 400
        
        # Find requests by user email
        print(f"DEBUG: Searching for requests with user_email: {user_email}")
        requests = list(mongo.db.service_requests.find({"user_email": user_email}))
        print(f"DEBUG: Found {len(requests)} requests for user_email: {user_email}")
        
        # Convert ObjectId to string for JSON serialization
        for req in requests:
            req['_id'] = str(req['_id'])
            if 'provider_id' in req:
                req['provider_id'] = str(req['provider_id'])
        
        # Sort by creation date (newest first)
        requests.sort(key=lambda x: x['created_at'], reverse=True)
        
        return jsonify({
            "success": True,
            "requests": requests
        }), 200
        
    except Exception as e:
        print(f"Error fetching user requests: {e}")
        return jsonify({"error": "Failed to fetch user requests"}), 500

@request_bp.route('/my-requests', methods=['GET'])
def get_my_requests():
    """Get all requests sent by the authenticated user (using JWT token)"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization token required"}), 401
        
        token = auth_header.split(' ')[1]
        
        # Decode token to get user_id
        from config import app
        import jwt
        try:
            payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            user_id = payload.get('user_id')
            if not user_id:
                return jsonify({"error": "Invalid token"}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        
        # Find user by user_id to get email
        user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        user_email = user.get('email')
        print(f"DEBUG: Token-based search - user_id: {user_id}, user_email: {user_email}")
        
        # Find requests by user email
        requests = list(mongo.db.service_requests.find({"user_email": user_email}))
        print(f"DEBUG: Found {len(requests)} requests for user_email: {user_email}")
        
        # Convert ObjectId to string for JSON serialization
        for req in requests:
            req['_id'] = str(req['_id'])
            if 'provider_id' in req:
                req['provider_id'] = str(req['provider_id'])
        
        # Sort by creation date (newest first)
        requests.sort(key=lambda x: x['created_at'], reverse=True)
        
        return jsonify({
            "success": True,
            "requests": requests
        }), 200
        
    except Exception as e:
        print(f"Error fetching user requests: {e}")
        return jsonify({"error": "Failed to fetch user requests"}), 500

@request_bp.route('/<request_id>', methods=['GET'])
def get_request_details(request_id):
    """Get details of a specific request"""
    try:
        request_obj = mongo.db.service_requests.find_one({"_id": ObjectId(request_id)})
        
        if not request_obj:
            return jsonify({"error": "Request not found"}), 404
        
        request_obj['_id'] = str(request_obj['_id'])
        if 'provider_id' in request_obj:
            request_obj['provider_id'] = str(request_obj['provider_id'])
        
        return jsonify({
            "success": True,
            "request": request_obj
        }), 200
        
    except Exception as e:
        print(f"Error fetching request details: {e}")
        return jsonify({"error": "Failed to fetch request details"}), 500

@request_bp.route('/<request_id>/cancel', methods=['PUT'])
def cancel_request(request_id):
    """Cancel a service request"""
    try:
        result = mongo.db.service_requests.update_one(
            {"_id": ObjectId(request_id)},
            {
                "$set": {
                    "status": "cancelled",
                    "updated_at": datetime.datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "Request not found"}), 404
        
        return jsonify({
            "success": True,
            "message": "Request cancelled successfully"
        }), 200
        
    except Exception as e:
        print(f"Error cancelling request: {e}")
        return jsonify({"error": "Failed to cancel request"}), 500 