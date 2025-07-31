from flask import Flask
from flask_pymongo import PyMongo
from flask_bcrypt import Bcrypt
import os

app = Flask(__name__)

# --- Configuration ---
# mongo db connection 
MONGO_URI = "mongodb://localhost:27017/quickfix"
app.config["MONGO_URI"] = MONGO_URI

# This is used for signing JWTs, change it to a random secret string
app.config["SECRET_KEY"] = "your_super_secret_key_change_me" 

# --- Extensions ---
# Initialize PyMongo for database interaction
mongo = PyMongo(app)
# Initialize Bcrypt for password hashing
bcrypt = Bcrypt(app)