from flask import Blueprint, request, jsonify
from config import mongo, app
import jwt
from functools import wraps
from bson import ObjectId

profile_bp = Blueprint('profile', __name__)

# JWT token verification decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        print(f"Token received: {token[:20]}..." if token else "No token")
        
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            # Remove 'Bearer ' prefix if present
            if token.startswith('Bearer '):
                token = token[7:]
            
            print(f"Token after Bearer removal: {token[:20]}...")
            
            # Decode token with correct secret key
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            print(f"Token decoded successfully: {data}")
            
            provider_id = data.get('provider_id')
            print(f"Provider ID from token: {provider_id}")
            
            if not provider_id:
                return jsonify({'message': 'Invalid token'}), 401
            
            try:
                provider_obj_id = ObjectId(provider_id)
            except Exception:
                return jsonify({'message': 'Invalid token'}), 401
            
            current_provider = mongo.db.providers.find_one({'_id': provider_obj_id})
            print(f"Provider found: {current_provider is not None}")
            
            if not current_provider:
                return jsonify({'message': 'Invalid token'}), 401
                
        except Exception as e:
            print(f"Token verification error: {str(e)}")
            return jsonify({'message': 'Invalid token'}), 401
            
        return f(current_provider, *args, **kwargs)
    return decorated

@profile_bp.route('/location', methods=['GET'])
@token_required
def get_provider_location(current_provider):
    """Get provider's saved location"""
    try:
        provider_id = str(current_provider['_id'])
        provider = mongo.db.providers.find_one({'_id': current_provider['_id']})
        
        if provider and 'location' in provider:
            return jsonify({
                'success': True,
                'location': provider['location']
            }), 200
        else:
            return jsonify({
                'success': True,
                'location': None
            }), 200
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@profile_bp.route('/location', methods=['POST'])
@token_required
def save_provider_location(current_provider):
    """Save provider's location"""
    try:
        data = request.get_json()
        lat = data.get('lat')
        lng = data.get('lng')
        address = data.get('address')
        
        if not lat or not lng:
            return jsonify({'success': False, 'message': 'Latitude and longitude are required'}), 400
        
        # Update provider with location
        mongo.db.providers.update_one(
            {'_id': current_provider['_id']},
            {'$set': {
                'location': {
                    'lat': float(lat),
                    'lng': float(lng),
                    'address': address
                }
            }}
        )
        
        return jsonify({
            'success': True,
            'message': 'Location saved successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@profile_bp.route('/details', methods=['GET'])
@token_required
def get_provider_details(current_provider):
    """Get provider's business details"""
    try:
        provider = mongo.db.providers.find_one({'_id': current_provider['_id']})
        
        if provider:
            # Return only the business details fields
            details = {
                'business_name': provider.get('business_name', ''),
                'provider_type': provider.get('provider_type', ''),
                'phone': provider.get('phone', ''),
                'address': provider.get('address', ''),
                'services': provider.get('services', ''),
                'working_hours': provider.get('working_hours', '')
            }
            return jsonify({
                'success': True,
                'details': details
            }), 200
        else:
            return jsonify({'success': False, 'message': 'Provider not found'}), 404
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@profile_bp.route('/details', methods=['POST'])
@token_required
def save_provider_details(current_provider):
    """Save provider's business details"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['business_name', 'provider_type', 'phone']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'message': f'{field} is required'}), 400
        
        # Update provider with business details
        update_data = {
            'business_name': data.get('business_name'),
            'provider_type': data.get('provider_type'),
            'phone': data.get('phone'),
            'address': data.get('address', ''),
            'services': data.get('services', ''),
            'working_hours': data.get('working_hours', '')
        }
        
        mongo.db.providers.update_one(
            {'_id': current_provider['_id']},
            {'$set': update_data}
        )
        
        return jsonify({
            'success': True,
            'message': 'Business details saved successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500 