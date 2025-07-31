from flask import Flask
from flask_cors import CORS
from routes.auth_routes import auth_bp
from routes.profile_routes import profile_bp
from routes.service_routes import service_bp
from routes.request_routes import request_bp

app = Flask(__name__)
CORS(app)

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/providers/auth')
app.register_blueprint(profile_bp, url_prefix='/api/providers/profile')
app.register_blueprint(service_bp, url_prefix='/api/providers/services')
app.register_blueprint(request_bp, url_prefix='/api/providers/requests')

if __name__ == '__main__':
    app.run(debug=True, port=8002)
