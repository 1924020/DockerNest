from flask import Flask
from flask_cors import CORS
from config import DATABASE_URI, SECRET_KEY
from models import db, bcrypt
from flask_jwt_extended import JWTManager
from routes import register_routes

app = Flask(__name__)

CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = SECRET_KEY

db.init_app(app)
bcrypt.init_app(app)
jwt = JWTManager(app)

@app.before_first_request
def create_tables():
    db.create_all()

register_routes(app)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
