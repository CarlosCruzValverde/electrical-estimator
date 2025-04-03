import os
from flask import Flask
from dotenv import load_dotenv
from flask_migrate import Migrate
from database import db

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY")

# Retrieve the variables
DATABASE_HOSTNAME = os.getenv("DATABASE_HOSTNAME")
DATABASE_PORT = os.getenv("DATABASE_PORT")
DATABASE_PASSWORD = os.getenv("DATABASE_PASSWORD")
DATABASE_NAME = os.getenv("DATABASE_NAME")
DATABASE_USERNAME = os.getenv("DATABASE_USERNAME")

# Create the database URL
DATABASE_URL = f"postgresql+psycopg2://{DATABASE_USERNAME}:{DATABASE_PASSWORD}@{DATABASE_HOSTNAME}:{DATABASE_PORT}/{DATABASE_NAME}"

# Configure the database URI. Make sure the environment variable is set
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize the database and migration
db.init_app(app)
migrate = Migrate(app, db)

# Import your models after initializing the db
import models

# apply the blueprints to the app
import auth
import portfolio

app.register_blueprint(auth.bp)
app.register_blueprint(portfolio.bp)
app.add_url_rule("/", endpoint="index")

@app.teardown_appcontext
def teardown_db(exception):
    db.session.remove()


if __name__ == "__main__":
    with app.app_context():
        app.run(host="0.0.0.0", port=8000)