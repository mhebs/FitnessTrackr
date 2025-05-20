import os
import logging
import urllib.parse
from datetime import datetime, timedelta
from flask import render_template, url_for
from app import app, db

logger = logging.getLogger(__name__)

class EmailNotification:
    """A simple model to store generated email notifications"""
    
    def __init__(self, to_email, subject, content, created_at, form_url):
        self.to_email = to_email
        self.subject = subject
        self.content = content
        self.created_at = created_at
        self.form_url = form_url
        self.is_read = False
    
    def to_dict(self):
        return {
            'to_email': self.to_email,
            'subject': self.subject,
            'content': self.content,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'form_url': self.form_url,
            'is_read': self.is_read
        }

# In-memory storage for email notifications
email_notifications = []

def send_workout_reminder(to_email, from_email):
    """Generate a workout reminder email with a pre-filled form link."""
    yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
    
    # Create a pre-filled form URL for the current host
    params = {
        "date": yesterday,
        "from_email": "true"
    }
    
    # Use request.host_url in routes.py to construct the full URL
    # Here we'll just store the route and params
    form_url = f"/form?{urllib.parse.urlencode(params)}"
    
    # Prepare email content using template
    with app.app_context():
        html_content = render_template(
            'email_template.html',
            form_url=form_url,
            default_date=yesterday
        )
    
    subject = f"Log Your Workout for {yesterday}"
    
    # Create notification entry
    notification = EmailNotification(
        to_email=to_email,
        subject=subject,
        content=html_content,
        created_at=datetime.now(),
        form_url=form_url
    )
    
    # Store the notification
    email_notifications.append(notification)
    
    # Limit to last 10 notifications
    if len(email_notifications) > 10:
        email_notifications.pop(0)
    
    logger.info(f"Workout reminder created for {to_email}")
    return True

def get_latest_notification():
    """Get the most recent email notification."""
    if email_notifications:
        return email_notifications[-1]
    return None

def get_all_notifications():
    """Get all stored email notifications."""
    return email_notifications
