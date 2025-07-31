from flask import Blueprint, request, jsonify
import requests
from math import radians, cos, sin, asin, sqrt
from config import mongo

service_bp = Blueprint('service_bp', __name__)

# Haversine formula to calculate distance in meters
def haversine(lon1, lat1, lon2, lat2):
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a)) 
    r = 6371 # Radius of earth in kilometers
    return c * r * 1000

@service_bp.route('/nearby', methods=['GET'])
def get_nearby_services():
    lat = request.args.get('lat', type=float)
    lng = request.args.get('lng', type=float)
    service_type = request.args.get('service_type')

    if not all([lat, lng, service_type]):
        return jsonify({"error": "Missing required parameters"}), 400

    query_map = {
        "fuel": f'''
            node["amenity"="fuel"](around:5000,{lat},{lng});
            node["shop"="fuel"](around:5000,{lat},{lng});
        ''',
        "garage": f'''
            node["shop"~"car|car_repair|tyres"](around:5000,{lat},{lng});
            node["craft"="auto_mechanic"](around:5000,{lat},{lng});
            node["shop"="car_repair"](around:5000,{lat},{lng});
            node["shop"="tyres"](around:5000,{lat},{lng});
        ''',
        "towing": f'''
            node["shop"~"car|car_repair"](around:5000,{lat},{lng});
            node["amenity"="towing"](around:5000,{lat},{lng});
            node["shop"="towing"](around:5000,{lat},{lng});
        '''
    }
    
    overpass_query = f"""
    [out:json][timeout:25];
    (
      {query_map.get(service_type, '')}
    );
    out center;
    """
    
    try:
        response = requests.post(
            "https://overpass-api.de/api/interpreter", 
            data=overpass_query,
            timeout=30,  # 30 second timeout
            headers={'User-Agent': 'QuickFix/1.0'}
        )
        response.raise_for_status()
        data = response.json()
        
        services = []
        for element in data.get('elements', []):
            tags = element.get('tags', {})
            service_lat = element.get('lat')
            service_lon = element.get('lon')
            
            if service_lat is None or service_lon is None:
                continue

            service_name = tags.get('name')
            if not service_name or service_name == 'N/A':
                continue

            service = {
                "id": element.get('id'),
                "name": service_name,
                "type": service_type,
                "location": { "lat": service_lat, "lng": service_lon },
                "distance": haversine(lng, lat, service_lon, service_lat),
                "phone": tags.get('phone') or tags.get('contact:phone') or None
            }
            services.append(service)

        services.sort(key=lambda x: x['distance'])

        return jsonify({"services": services}), 200
        
    except requests.exceptions.Timeout:
        print("Overpass API timeout")
        return jsonify({"error": "Service temporarily unavailable. Please try again later."}), 503
        
    except requests.exceptions.RequestException as e:
        print(f"Overpass API error: {e}")
        return jsonify({"error": "Unable to fetch services at this time. Please try again later."}), 503
        
    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({"error": "Failed to fetch services", "details": str(e)}), 500

@service_bp.route('/providers', methods=['GET'])
def get_providers_by_service():
    """Get all registered providers by service type"""
    service_type = request.args.get('service_type')
    lat = request.args.get('lat', type=float)
    lng = request.args.get('lng', type=float)
    
    if not service_type:
        return jsonify({"error": "Service type is required"}), 400
    
    try:
        # Find providers with the specified service type and location
        query = {
            "provider_type": service_type,
            "location": {"$exists": True}
        }
        
        providers = list(mongo.db.providers.find(query))
        
        services = []
        for provider in providers:
            if 'location' in provider and lat and lng:
                # Calculate distance if user location is provided
                distance = haversine(lng, lat, provider['location']['lng'], provider['location']['lat'])
            else:
                distance = 0
            
            service = {
                "id": str(provider['_id']),
                "name": provider.get('business_name', provider.get('name', 'Unknown')),
                "type": provider.get('provider_type', service_type),
                "location": provider.get('location', {}),
                "distance": distance,
                "phone": provider.get('phone'),
                "address": provider.get('address'),
                "services": provider.get('services', ''),
                "working_hours": provider.get('working_hours', ''),
                "source": "registered_provider"
            }
            services.append(service)
        
        # Sort by distance if user location is provided
        if lat and lng:
            services.sort(key=lambda x: x['distance'])
        
        return jsonify({"services": services}), 200
        
    except Exception as e:
        print(f"Error fetching providers: {e}")
        return jsonify({"error": "Failed to fetch providers"}), 500
