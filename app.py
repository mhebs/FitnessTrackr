import os
import logging

from flask import Flask
from werkzeug.middleware.proxy_fix import ProxyFix
from extensions import db

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create the app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "workout-tracker-secret-key")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)  # Needed for url_for to generate with https

# Configure the database
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///workout_tracker.db")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize the app with the extension
db.init_app(app)

# Email configuration
app.config["SENDGRID_API_KEY"] = os.environ.get("SENDGRID_API_KEY")
app.config["FROM_EMAIL"] = os.environ.get("FROM_EMAIL", "noreply@workouttracker.com")
app.config["TO_EMAIL"] = os.environ.get("TO_EMAIL", "user@example.com")

# Set production mode
app.config["PRODUCTION"] = os.environ.get("PRODUCTION", "False").lower() == "true"

# Add cache busting for static files
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

# Import models and create tables
from models import Workout  # noqa: E402

with app.app_context():
    # Create database tables
    db.create_all()
    logger.info("Database tables created")

# Import routes
import routes  # noqa: E402

if __name__ == '__main__':
    app.run(debug=True)
