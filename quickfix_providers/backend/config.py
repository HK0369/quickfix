from flask import Flask
from flask_pymongo import PyMongo
from flask_bcrypt import Bcrypt
import os

app = Flask(__name__)

# --- Configuration ---
MONGO_URI = "mongodb://localhost:27017/quickfix"
app.config["MONGO_URI"] = MONGO_URI
app.config["SECRET_KEY"] = "your_super_secret_key_change_me"

mongo = PyMongo(app)
bcrypt = Bcrypt(app)
