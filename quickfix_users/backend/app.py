from config import app
from routes.auth_routes import auth_bp
from routes.service_routes import service_bp  # <-- IMPORT the new service routes
from routes.request_routes import request_bp
from flask_cors import CORS

# Enable Cross-Origin Resource Sharing (CORS)
# This allows your frontend (on a different port) to communicate with this backend
CORS(app)

# Register the authentication blueprint with a URL prefix
app.register_blueprint(auth_bp, url_prefix='/api/auth')

# Register the new service blueprint with a URL prefix
app.register_blueprint(service_bp, url_prefix='/api/services') # <-- REGISTER the new routes

# Register the request blueprint
app.register_blueprint(request_bp, url_prefix='/api/requests')

@app.route('/')
def index():
    return "QuickFix Backend Server is running!"

if __name__ == '__main__':
    # Run the Flask app
    # debug=True will auto-reload the server when you make changes
    app.run(port=8001, debug=True)
