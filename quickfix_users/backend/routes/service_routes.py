from flask import Blueprint, request, jsonify
import requests
from math import radians, cos, sin, asin, sqrt

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

    # --- UPDATED: More comprehensive queries for each service type ---
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
    
    # Build the final query
    overpass_query = f"""
    [out:json][timeout:25];
    (
      {query_map.get(service_type, '')}
    );
    out center;
    """
    
    all_services = []
    
    try:
        # Fetch from OpenStreetMap
        response = requests.post(
            "https://overpass-api.de/api/interpreter", 
            data=overpass_query,
            timeout=30,  # 30 second timeout
            headers={'User-Agent': 'QuickFix/1.0'}
        )
        response.raise_for_status()
        data = response.json()
        
        for element in data.get('elements', []):
            tags = element.get('tags', {})
            service_lat = element.get('lat')
            service_lon = element.get('lon')
            
            if service_lat is None or service_lon is None:
                continue

            # Only include services with actual names
            service_name = tags.get('name')
            if not service_name or service_name == 'N/A':
                continue

            service = {
                "id": f"osm_{element.get('id')}",
                "name": service_name,
                "type": service_type,
                "location": { "lat": service_lat, "lng": service_lon },
                "distance": haversine(lng, lat, service_lon, service_lat),
                "phone": tags.get('phone') or tags.get('contact:phone') or None,
                "source": "openstreetmap"
            }
            all_services.append(service)

    except requests.exceptions.Timeout:
        print("Overpass API timeout")
    except requests.exceptions.RequestException as e:
        print(f"Overpass API error: {e}")
    except Exception as e:
        print(f"An error occurred with OpenStreetMap: {e}")
    
    # Fetch from registered providers
    try:
        provider_response = requests.get(
            f"http://localhost:8002/api/providers/services/providers",
            params={
                'service_type': service_type,
                'lat': lat,
                'lng': lng
            },
            timeout=10
        )
        if provider_response.status_code == 200:
            provider_services = provider_response.json().get('services', [])
            all_services.extend(provider_services)
        else:
            print(f"Provider API error: {provider_response.status_code}")
    except Exception as e:
        print(f"Error fetching from providers: {e}")

    # Sort all services by distance
    all_services.sort(key=lambda x: x['distance'])

    return jsonify({"services": all_services}), 200
