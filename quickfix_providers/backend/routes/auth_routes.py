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

    if not all([name, email, password, provider_type, address, services_provided, phone]):
        return jsonify({"error": "Missing required fields"}), 400

    if mongo.db.providers.find_one({"email": email}):
        return jsonify({"error": "Provider with this email already exists"}), 409

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    provider_id = mongo.db.providers.insert_one({
        "name": name,
        "email": email,
        "password": hashed_password,
        "provider_type": provider_type,
        "address": address,
        "services_provided": services_provided,
        "phone": phone,
        "license_number": license_number,
        "working_hours": working_hours,
        "created_at": datetime.datetime.utcnow()
    }).inserted_id

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
        
        return jsonify({
            "success": True,
            "provider": provider
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
        name = data.get('name')
        email = data.get('email')
        provider_type = data.get('provider_type')
        address = data.get('address')
        services_provided = data.get('services_provided')
        phone = data.get('phone')
        license_number = data.get('license_number')
        working_hours = data.get('working_hours')
        
        if not provider_id:
            return jsonify({"error": "Provider ID is required"}), 400
        
        # Check if email is already taken by another provider
        existing_provider = mongo.db.providers.find_one({"email": email, "_id": {"$ne": ObjectId(provider_id)}})
        if existing_provider:
            return jsonify({"error": "Email is already taken by another provider"}), 409
        
        # Update provider data
        update_data = {
            "name": name,
            "email": email,
            "provider_type": provider_type,
            "address": address,
            "services_provided": services_provided,
            "phone": phone,
            "license_number": license_number,
            "working_hours": working_hours,
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
        
        return jsonify({
            "success": True,
            "message": "Profile updated successfully",
            "provider": updated_provider
        }), 200
        
    except Exception as e:
        print(f"Error updating provider profile: {e}")
        return jsonify({"error": "Failed to update profile"}), 500
