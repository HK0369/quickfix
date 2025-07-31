from flask import Blueprint, request, jsonify
from config import mongo
import datetime
from bson.objectid import ObjectId

request_bp = Blueprint('request_bp', __name__)

@request_bp.route('/provider-requests', methods=['GET'])
def get_provider_requests():
    """Get all requests for a specific provider"""
    try:
        provider_id = request.args.get('provider_id')
        
        if not provider_id:
            return jsonify({"error": "Provider ID is required"}), 400
        
        # Find requests for this provider
        requests = list(mongo.db.service_requests.find({"provider_id": provider_id}))
        
        # Convert ObjectId to string for JSON serialization
        for req in requests:
            req['_id'] = str(req['_id'])
            req['provider_id'] = str(req['provider_id'])
        
        # Sort by creation date (newest first)
        requests.sort(key=lambda x: x['created_at'], reverse=True)
        
        return jsonify({
            "success": True,
            "requests": requests
        }), 200
        
    except Exception as e:
        print(f"Error fetching provider requests: {e}")
        return jsonify({"error": "Failed to fetch provider requests"}), 500

@request_bp.route('/<request_id>', methods=['GET'])
def get_request_details(request_id):
    """Get details of a specific request"""
    try:
        request_obj = mongo.db.service_requests.find_one({"_id": ObjectId(request_id)})
        
        if not request_obj:
            return jsonify({"error": "Request not found"}), 404
        
        request_obj['_id'] = str(request_obj['_id'])
        request_obj['provider_id'] = str(request_obj['provider_id'])
        
        return jsonify({
            "success": True,
            "request": request_obj
        }), 200
        
    except Exception as e:
        print(f"Error fetching request details: {e}")
        return jsonify({"error": "Failed to fetch request details"}), 500

@request_bp.route('/<request_id>/accept', methods=['PUT'])
def accept_request(request_id):
    """Accept a service request"""
    try:
        result = mongo.db.service_requests.update_one(
            {"_id": ObjectId(request_id)},
            {
                "$set": {
                    "status": "accepted",
                    "updated_at": datetime.datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "Request not found"}), 404
        
        return jsonify({
            "success": True,
            "message": "Request accepted successfully"
        }), 200
        
    except Exception as e:
        print(f"Error accepting request: {e}")
        return jsonify({"error": "Failed to accept request"}), 500

@request_bp.route('/<request_id>/complete', methods=['PUT'])
def complete_request(request_id):
    """Mark a service request as completed"""
    try:
        result = mongo.db.service_requests.update_one(
            {"_id": ObjectId(request_id)},
            {
                "$set": {
                    "status": "completed",
                    "updated_at": datetime.datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "Request not found"}), 404
        
        return jsonify({
            "success": True,
            "message": "Request marked as completed"
        }), 200
        
    except Exception as e:
        print(f"Error completing request: {e}")
        return jsonify({"error": "Failed to complete request"}), 500

@request_bp.route('/<request_id>/reject', methods=['PUT'])
def reject_request(request_id):
    """Reject a service request"""
    try:
        data = request.get_json()
        rejection_reason = data.get('rejection_reason', 'No reason provided')
        
        result = mongo.db.service_requests.update_one(
            {"_id": ObjectId(request_id)},
            {
                "$set": {
                    "status": "rejected",
                    "rejection_reason": rejection_reason,
                    "updated_at": datetime.datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "Request not found"}), 404
        
        return jsonify({
            "success": True,
            "message": "Request rejected successfully"
        }), 200
        
    except Exception as e:
        print(f"Error rejecting request: {e}")
        return jsonify({"error": "Failed to reject request"}), 500

@request_bp.route('/stats', methods=['GET'])
def get_provider_stats():
    """Get statistics for a provider"""
    try:
        provider_id = request.args.get('provider_id')
        
        if not provider_id:
            return jsonify({"error": "Provider ID is required"}), 400
        
        # Get counts for different statuses
        total_requests = mongo.db.service_requests.count_documents({"provider_id": provider_id})
        pending_requests = mongo.db.service_requests.count_documents({"provider_id": provider_id, "status": "pending"})
        accepted_requests = mongo.db.service_requests.count_documents({"provider_id": provider_id, "status": "accepted"})
        completed_requests = mongo.db.service_requests.count_documents({"provider_id": provider_id, "status": "completed"})
        rejected_requests = mongo.db.service_requests.count_documents({"provider_id": provider_id, "status": "rejected"})
        
        stats = {
            "total_requests": total_requests,
            "pending_requests": pending_requests,
            "accepted_requests": accepted_requests,
            "completed_requests": completed_requests,
            "rejected_requests": rejected_requests
        }
        
        return jsonify({
            "success": True,
            "stats": stats
        }), 200
        
    except Exception as e:
        print(f"Error fetching provider stats: {e}")
        return jsonify({"error": "Failed to fetch provider stats"}), 500 