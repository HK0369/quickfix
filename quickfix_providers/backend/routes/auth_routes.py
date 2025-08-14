from flask import Blueprint, request, jsonify
from config import mongo, bcrypt
import jwt
import datetime
from bson.objectid import ObjectId

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    provider_type = data.get('provider_type')
    address = data.get('address')
    services_provided = data.get('services_provided')
    phone = data.get('phone')
    license_number = data.get('license_number')
    working_hours = data.get('working_hours')
    location = data.get('location')  # Add location field

    if not all([name, email, password, provider_type, address, services_provided, phone]):
        return jsonify({"error": "Missing required fields"}), 400

    if mongo.db.providers.find_one({"email": email}):
        return jsonify({"error": "Provider with this email already exists"}), 409

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    provider_data = {
        "name": name,
        "email": email,
        "password": hashed_password,
        "provider_type": provider_type,
        "address": address,
        "services_provided": services_provided,
        "phone": phone,
        "license_number": license_number,
        "working_hours": working_hours,
        "location": location,  # Add location to provider data
        "created_at": datetime.datetime.utcnow()
    }

    provider_id = mongo.db.providers.insert_one(provider_data).inserted_id

    new_provider = mongo.db.providers.find_one({"_id": provider_id})
    new_provider.pop('password')
    new_provider['_id'] = str(new_provider['_id'])

    return jsonify({"message": "Provider created successfully", "provider": new_provider}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    from config import app
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    provider = mongo.db.providers.find_one({"email": email})

    if provider and bcrypt.check_password_hash(provider['password'], password):
        token = jwt.encode({
            'provider_id': str(provider['_id']),
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm="HS256")

        provider_data = {
            '_id': str(provider['_id']),
            'name': provider['name'],
            'email': provider['email'],
            'provider_type': provider['provider_type']
        }

        return jsonify({"message": "Login successful", "token": token, "provider": provider_data}), 200
    else:
        return jsonify({"error": "Invalid email or password"}), 401

@auth_bp.route('/profile', methods=['GET'])
def get_profile():
    """Get provider profile data"""
    try:
        provider_id = request.args.get('provider_id')
        print(f"DEBUG: Received request for provider_id: {provider_id}")
        
        if not provider_id:
            print("DEBUG: No provider_id provided")
            return jsonify({"error": "Provider ID is required"}), 400
        
        print(f"DEBUG: Searching for provider with ObjectId: {ObjectId(provider_id)}")
        provider = mongo.db.providers.find_one({"_id": ObjectId(provider_id)})
        
        if not provider:
            print(f"DEBUG: Provider not found for ID: {provider_id}")
            return jsonify({"error": "Provider not found"}), 404
        
        print(f"DEBUG: Found provider: {provider['name']} ({provider['email']})")
        
        # Remove password from response
        provider.pop('password', None)
        provider['_id'] = str(provider['_id'])
        
        # Map the response to match frontend expectations
        response_provider = {
            "_id": provider['_id'],
            "business_name": provider['name'],
            "provider_type": provider['provider_type'],
            "address": provider['address'],
            "services": provider.get('services_provided', ''),
            "phone": provider['phone'],
            "working_hours": provider.get('working_hours', ''),
            "location": provider.get('location'),  # Add location to response
            "created_at": provider.get('created_at'),
            "updated_at": provider.get('updated_at')
        }
        
        return jsonify({
            "success": True,
            "provider": response_provider
        }), 200
        
    except Exception as e:
        print(f"Error getting provider profile: {e}")
        return jsonify({"error": "Failed to get profile"}), 500

@auth_bp.route('/profile', methods=['PUT'])
def update_profile():
    """Update provider profile data"""
    try:
        data = request.get_json()
        provider_id = data.get('provider_id')
        business_name = data.get('business_name')
        provider_type = data.get('provider_type')
        address = data.get('address')
        services = data.get('services')
        phone = data.get('phone')
        working_hours = data.get('working_hours')
        location = data.get('location')  # Add location field
        
        if not provider_id:
            return jsonify({"error": "Provider ID is required"}), 400
        
        # Update provider data
        update_data = {
            "name": business_name,  # Map business_name to name field
            "provider_type": provider_type,
            "address": address,
            "services_provided": services,  # Map services to services_provided field
            "phone": phone,
            "working_hours": working_hours,
            "location": location,  # Add location to update data
            "updated_at": datetime.datetime.utcnow()
        }
        
        result = mongo.db.providers.update_one(
            {"_id": ObjectId(provider_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "Provider not found"}), 404
        
        # Get updated provider data
        updated_provider = mongo.db.providers.find_one({"_id": ObjectId(provider_id)})
        updated_provider.pop('password', None)
        updated_provider['_id'] = str(updated_provider['_id'])
        
        # Map the response to match frontend expectations
        response_provider = {
            "_id": updated_provider['_id'],
            "business_name": updated_provider['name'],
            "provider_type": updated_provider['provider_type'],
            "address": updated_provider['address'],
            "services": updated_provider.get('services_provided', ''),
            "phone": updated_provider['phone'],
            "working_hours": updated_provider.get('working_hours', ''),
            "location": updated_provider.get('location'),  # Add location to response
            "created_at": updated_provider.get('created_at'),
            "updated_at": updated_provider.get('updated_at')
        }
        
        return jsonify({
            "success": True,
            "message": "Profile updated successfully",
            "provider": response_provider
        }), 200
        
    except Exception as e:
        print(f"Error updating provider profile: {e}")
        return jsonify({"error": "Failed to update profile"}), 500
