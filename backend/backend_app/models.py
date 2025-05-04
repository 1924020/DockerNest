from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt

db = SQLAlchemy()
bcrypt = Bcrypt()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)
    containers = db.relationship('Container', backref='user', lazy=True)

    def set_password(self, plaintext):
        self.password = bcrypt.generate_password_hash(plaintext).decode('utf-8')

    def check_password(self, plaintext):
        return bcrypt.check_password_hash(self.password, plaintext)

class Container(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    image = db.Column(db.String(100))
    docker_id = db.Column(db.String(100))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
