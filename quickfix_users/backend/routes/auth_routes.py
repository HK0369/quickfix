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

    if not name or not email or not password:
        return jsonify({"error": "Missing required fields"}), 400

    # Check if user already exists
    if mongo.db.users.find_one({"email": email}):
        return jsonify({"error": "User with this email already exists"}), 409

    # Hash the password for security
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    # Create the new user
    user_id = mongo.db.users.insert_one({
        "name": name,
        "email": email,
        "password": hashed_password,
        "created_at": datetime.datetime.utcnow()
    }).inserted_id

    new_user = mongo.db.users.find_one({"_id": user_id})

    # Don't send the password back
    new_user.pop('password')
    new_user['_id'] = str(new_user['_id']) # Convert ObjectId to string

    return jsonify({"message": "User created successfully", "user": new_user}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    from config import app # Import app to access SECRET_KEY
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = mongo.db.users.find_one({"email": email})

    # Check if user exists and password is correct
    if user and bcrypt.check_password_hash(user['password'], password):
        # Generate a JWT token
        token = jwt.encode({
            'user_id': str(user['_id']),
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24) # Token expires in 24 hours
        }, app.config['SECRET_KEY'], algorithm="HS256")

        # Prepare user data to send back (without password)
        user_data = {
            '_id': str(user['_id']),
            'name': user['name'],
            'email': user['email']
        }

        return jsonify({"message": "Login successful", "token": token, "user": user_data}), 200
    else:
        return jsonify({"error": "Invalid email or password"}), 401

@auth_bp.route('/profile', methods=['GET'])
def get_profile():
    """Get user profile data"""
    try:
        # Get user ID from token (you'll need to implement token verification)
        user_id = request.args.get('user_id')
        
        if not user_id:
            return jsonify({"error": "User ID is required"}), 400
        
        user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Remove password from response
        user.pop('password', None)
        user['_id'] = str(user['_id'])
        
        return jsonify({
            "success": True,
            "user": user
        }), 200
        
    except Exception as e:
        print(f"Error getting user profile: {e}")
        return jsonify({"error": "Failed to get profile"}), 500

@auth_bp.route('/profile', methods=['PUT'])
def update_profile():
    """Update user profile data"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        name = data.get('name')
        email = data.get('email')
        
        if not user_id:
            return jsonify({"error": "User ID is required"}), 400
        
        # Check if email is already taken by another user
        existing_user = mongo.db.users.find_one({"email": email, "_id": {"$ne": ObjectId(user_id)}})
        if existing_user:
            return jsonify({"error": "Email is already taken by another user"}), 409
        
        # Update user data
        update_data = {
            "name": name,
            "email": email,
            "updated_at": datetime.datetime.utcnow()
        }
        
        result = mongo.db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "User not found"}), 404
        
        # Get updated user data
        updated_user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
        updated_user.pop('password', None)
        updated_user['_id'] = str(updated_user['_id'])
        
        return jsonify({
            "success": True,
            "message": "Profile updated successfully",
            "user": updated_user
        }), 200
        
    except Exception as e:
        print(f"Error updating user profile: {e}")
        return jsonify({"error": "Failed to update profile"}), 500