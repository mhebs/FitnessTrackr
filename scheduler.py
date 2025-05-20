import os
import logging
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from app import app
from email_sender import send_workout_reminder

logger = logging.getLogger(__name__)

def create_scheduler():
    """Create and configure the scheduler."""
    scheduler = BackgroundScheduler()
    
    # Add the daily notification job - 8:00 AM US Eastern Time (UTC-4 or UTC-5 depending on DST)
    # Using 12:00 UTC which is approximately 8:00 AM US Eastern
    scheduler.add_job(
        generate_daily_reminder,
        CronTrigger(hour=12, minute=0),
        id='daily_reminder',
        replace_existing=True
    )
    
    # Add end of day job to mark missing days as Rest
    scheduler.add_job(
        mark_rest_days,
        CronTrigger(hour=23, minute=59),
        id='mark_rest_days',
        replace_existing=True
    )
    
    # Add a job for testing notifications (runs every 5 minutes)
    # This is for demonstration purposes
    scheduler.add_job(
        generate_test_reminder,
        CronTrigger(minute='*/5'),
        id='test_reminder',
        replace_existing=True
    )
    
    return scheduler

def generate_daily_reminder():
    """Generate daily workout reminder notification."""
    with app.app_context():
        logger.info("Generating daily workout reminder")
        
        # These could come from app config or user preferences
        from_email = app.config.get('FROM_EMAIL', 'noreply@workout-tracker.com')
        to_email = app.config.get('TO_EMAIL', 'user@example.com')
        
        success = send_workout_reminder(to_email, from_email)
        
        if success:
            logger.info(f"Reminder generated successfully for {to_email}")
        else:
            logger.error(f"Failed to generate reminder for {to_email}")

def generate_test_reminder():
    """Generate a test reminder (for demonstration purposes)."""
    with app.app_context():
        # Only generate test reminders in development mode
        if not app.config.get('PRODUCTION', False):
            logger.info("Generating test workout reminder")
            
            from_email = "test@workout-tracker.com"
            to_email = "test@example.com"
            
            success = send_workout_reminder(to_email, from_email)
            
            if success:
                logger.info(f"Test reminder generated successfully")

def mark_rest_days():
    """Mark days with no entry as 'Rest' at the end of the day."""
    with app.app_context():
        logger.info("Checking for missing workout entries")
        
        from models import Workout
        from app import db
        
        # Get yesterday's date
        yesterday = datetime.now().date() - timedelta(days=1)
        
        # Check if workout exists for yesterday
        workout = Workout.query.filter_by(date=yesterday).first()
        
        if not workout:
            logger.info(f"No workout found for {yesterday}, adding Rest day")
            
            # Create Rest day entry
            rest_workout = Workout()
            rest_workout.date = yesterday
            rest_workout.workout_type = 'Rest'
            rest_workout.duration = 0
            rest_workout.notes = 'Automatically marked as Rest'
            
            try:
                db.session.add(rest_workout)
                db.session.commit()
                logger.info(f"Successfully added Rest day for {yesterday}")
            except Exception as e:
                db.session.rollback()
                logger.error(f"Error adding Rest day: {str(e)}")

# Initialize scheduler
scheduler = create_scheduler()

def start():
    """Start the scheduler."""
    if not scheduler.running:
        scheduler.start()
        logger.info("Scheduler started")
