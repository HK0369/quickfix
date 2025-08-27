# 🚗 QuickFix - Roadside Assistance Platform

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-2.0+-green.svg)](https://flask.palletsprojects.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4.4+-green.svg)](https://mongodb.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A comprehensive roadside assistance platform that connects users in need with nearby service providers including fuel stations, towing services, and auto repair garages. Built with modern web technologies and real-time location services.

## 🌟 Features

### For Users
- **🔍 Real-time Location Services**: GPS-based location detection with manual map selection
- **🚗 Multiple Service Types**: Find fuel stations, towing services, and auto repair garages
- **📍 Smart Service Discovery**: Combines public services (OpenStreetMap) with verified providers
- **📱 Mobile-First Design**: Responsive interface optimized for all devices
- **⚡ Instant Results**: Real-time service availability and distance calculations
- **📞 Direct Contact**: Call service providers directly from the app
- **🗺️ Navigation Support**: Get directions to service locations

### For Service Providers
- **🏢 Business Profile Management**: Create and manage detailed business profiles
- **📍 Location Services**: Set precise service areas and coverage zones
- **🔄 Real-time Updates**: Update service availability and business hours
- **📊 Request Management**: Handle and respond to service requests
- **✅ Verification System**: Get verified provider status for customer trust

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Frontend │    │ Provider Frontend│    │   MongoDB       │
│   (Port 5500)   │    │   (Port 5500)   │    │   Database      │
└─────────┬───────┘    └─────────┬───────┘    └─────────────────┘
          │                      │
          ▼                      ▼
┌─────────────────┐    ┌─────────────────┐
│  User Backend   │    │ Provider Backend│
│  (Port 8001)    │    │  (Port 8002)   │
└─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- MongoDB 4.4 or higher
- Modern web browser with Geolocation API support
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/quickfix.git
   cd quickfix
   ```

2. **Set up MongoDB**
   ```bash
   # Start MongoDB service
   mongod
   
   # Or use Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

3. **Install Python dependencies**
   ```bash
   # Install user backend dependencies
   cd quickfix_users/backend
   pip install -r requirements.txt
   
   # Install provider backend dependencies
   cd ../../quickfix_providers/backend
   pip install -r requirements.txt
   ```

4. **Start the backend servers**
   ```bash
   # Terminal 1 - Start user backend (Port 8001)
   cd quickfix_users/backend
   python app.py
   
   # Terminal 2 - Start provider backend (Port 8002)
   cd quickfix_providers/backend
   python app.py
   ```

5. **Open the frontend applications**
   ```bash
   # Use Live Server or any HTTP server
   # Navigate to quickfix_users/forntend/index.html
   # Navigate to quickfix_providers/frontend/index.html
   ```

## 📁 Project Structure

```
quickfix/
├── quickfix_users/                 # User-facing application
│   ├── forntend/                   # User frontend (HTML/CSS/JS)
│   │   ├── index.html             # Main user interface
│   │   ├── css/                   # Stylesheets
│   │   ├── js/                    # JavaScript modules
│   │   ├── pages/                 # Additional pages
│   │   └── assets/                # Images and resources
│   ├── backend/                    # User backend (Flask)
│   │   ├── app.py                 # Main Flask application
│   │   ├── config.py              # Database configuration
│   │   ├── routes/                # API route definitions
│   │   └── requirements.txt       # Python dependencies
│   └── documentation/              # User-specific documentation
├── quickfix_providers/             # Provider-facing application
│   ├── frontend/                   # Provider frontend (HTML/CSS/JS)
│   │   ├── index.html             # Main provider interface
│   │   ├── css/                   # Stylesheets
│   │   ├── js/                    # JavaScript modules
│   │   ├── pages/                 # Additional pages
│   │   └── assets/                # Images and resources
│   ├── backend/                    # Provider backend (Flask)
│   │   ├── app.py                 # Main Flask application
│   │   ├── config.py              # Database configuration
│   │   ├── routes/                # API route definitions
│   │   └── requirements.txt       # Python dependencies
└── README.md                       # This file
```

## 🔧 Configuration

### Environment Variables
Create `.env` files in both backend directories:

**quickfix_users/backend/.env:**
```env
MONGO_URI=mongodb://localhost:27017/quickfix
JWT_SECRET=your_jwt_secret_key
PORT=8001
```

**quickfix_providers/backend/.env:**
```env
MONGO_URI=mongodb://localhost:27017/quickfix
JWT_SECRET=your_jwt_secret_key
PORT=8002
```

### Database Setup
The application will automatically create the necessary collections:
- `users` - User accounts and profiles
- `providers` - Service provider information
- `requests` - Service requests and status
- `services` - Available service types and categories

## 🌐 API Endpoints

### User API (Port 8001)
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User authentication
- `GET /api/services/nearby` - Find nearby services
- `POST /api/requests/create` - Create service request
- `GET /api/requests/user/:id` - Get user requests

### Provider API (Port 8002)
- `POST /api/providers/auth/signup` - Provider registration
- `POST /api/providers/auth/login` - Provider authentication
- `GET /api/providers/profile/:id` - Get provider profile
- `PUT /api/providers/profile/:id` - Update provider profile
- `GET /api/providers/services/providers` - Get registered providers
- `GET /api/providers/requests/:id` - Get provider requests

## 🧪 Testing

### Run Integration Tests
```bash
cd quickfix_users/backend
python test_integration.py
```

### Run Complete Request Flow Tests
```bash
cd quickfix_users/backend
python test_complete_request_flow.py
```

## 🎨 Frontend Features

### User Interface
- **Modern Design**: Clean, intuitive interface with blue (#3a69f5) primary color
- **Loading States**: Comprehensive loading indicators and visual feedback
- **Responsive Layout**: Mobile-first design that works on all screen sizes
- **Interactive Maps**: Click-to-select location with address resolution
- **Service Filtering**: Easy filtering by service type and distance

### Provider Interface
- **Dashboard**: Comprehensive business management dashboard
- **Profile Management**: Easy business profile updates
- **Request Handling**: Streamlined service request management
- **Service Configuration**: Flexible service type and area setup

## 🔒 Security Features

- **Password Hashing**: Bcrypt-based password security
- **JWT Authentication**: Secure token-based authentication
- **CORS Protection**: Cross-origin resource sharing configuration
- **Input Validation**: Comprehensive input sanitization
- **Error Handling**: Graceful error handling without information leakage

## 🚀 Deployment

### Production Considerations
- Use HTTPS for production (required for Geolocation API)
- Set up proper MongoDB authentication
- Configure environment variables securely
- Use production-grade WSGI server (Gunicorn, uWSGI)
- Set up reverse proxy (Nginx, Apache)
- Implement rate limiting and monitoring

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the documentation folders in each component
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Discussions**: Join community discussions for help and ideas

## 🔮 Roadmap

- [ ] Real-time notifications system
- [ ] Payment integration
- [ ] Advanced analytics dashboard
- [ ] Mobile app development
- [ ] AI-powered service matching
- [ ] Multi-language support
- [ ] Advanced filtering and search
- [ ] Service provider ratings and reviews

## 📊 System Requirements

- **Backend**: Python 3.8+, Flask 2.0+
- **Database**: MongoDB 4.4+
- **Frontend**: Modern browsers with ES6+ support
- **Location Services**: HTTPS required for production
- **Memory**: Minimum 2GB RAM recommended
- **Storage**: 1GB+ for application and database

---

**Built with ❤️ for safer roads and better roadside assistance**

*QuickFix - Your trusted roadside companion*
