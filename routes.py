import io
import csv
from datetime import datetime, timedelta
import logging
from flask import render_template, request, jsonify, redirect, url_for, send_file, Response
from sqlalchemy.exc import IntegrityError
from app import app, db
from models import Workout
from email_sender import get_all_notifications, get_latest_notification, send_workout_reminder

logger = logging.getLogger(__name__)

@app.route('/')
def dashboard():
    """Render the main dashboard."""
    return render_template('dashboard.html')

@app.route('/form')
def workout_form():
    """Render the workout form."""
    return render_template('form.html')

@app.route('/api/workouts', methods=['GET'])
def get_workouts():
    """API endpoint to retrieve workout data."""
    try:
        workouts = Workout.query.order_by(Workout.date).all()
        return jsonify({
            'success': True,
            'workouts': [workout.to_dict() for workout in workouts]
        })
    except Exception as e:
        logger.error(f"Error retrieving workouts: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/workouts', methods=['POST'])
def add_workout():
    """API endpoint to add a new workout."""
    try:
        # Get form data
        date_str = request.form.get('date')
        workout_type = request.form.get('workout_type')
        duration = request.form.get('duration', 0)
        notes = request.form.get('notes', '')
        
        # Validate required fields
        if not date_str or not workout_type:
            return '<div id="form-feedback" class="alert alert-danger">Date and workout type are required!</div>', 400

        # Parse date
        try:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return '<div id="form-feedback" class="alert alert-danger">Invalid date format. Use YYYY-MM-DD.</div>', 400

        # Set duration to 0 for Rest days
        if workout_type == 'Rest':
            duration = 0
        else:
            # Validate duration for non-rest workouts
            try:
                duration = int(duration)
                if duration <= 0:
                    return '<div id="form-feedback" class="alert alert-danger">Duration must be positive for non-rest workouts.</div>', 400
            except (ValueError, TypeError):
                return '<div id="form-feedback" class="alert alert-danger">Duration must be a number.</div>', 400

        # Check if a workout already exists for this date
        existing_workout = Workout.query.filter_by(date=date).first()
        if existing_workout:
            # Update existing workout
            existing_workout.workout_type = workout_type
            existing_workout.duration = duration
            existing_workout.notes = notes
            message = "Workout updated successfully!"
        else:
            # Create new workout
            new_workout = Workout()
            new_workout.date = date
            new_workout.workout_type = workout_type
            new_workout.duration = duration
            new_workout.notes = notes
            db.session.add(new_workout)
            message = "Workout logged successfully!"
        
        # Commit changes
        db.session.commit()
        
        # Return success message with HTMX-compatible response
        return f'<div id="form-feedback" class="alert alert-success success-message">{message}</div>'
    
    except IntegrityError as e:
        db.session.rollback()
        logger.error(f"Database integrity error: {str(e)}")
        return '<div id="form-feedback" class="alert alert-danger">Workout already exists for this date.</div>', 400
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error adding workout: {str(e)}")
        return f'<div id="form-feedback" class="alert alert-danger">Error: {str(e)}</div>', 500

@app.route('/export')
def export_data():
    """Export workout data as CSV."""
    try:
        # Get all workouts
        workouts = Workout.query.order_by(Workout.date).all()
        
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow(['Date', 'Workout Type', 'Duration (min)', 'Notes', 'Recorded At'])
        
        # Write data
        for workout in workouts:
            writer.writerow([
                workout.date,
                workout.workout_type,
                workout.duration,
                workout.notes,
                workout.created_at.strftime('%Y-%m-%d %H:%M:%S')
            ])
        
        # Prepare response
        output.seek(0)
        
        return send_file(
            io.BytesIO(output.getvalue().encode('utf-8')),
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'workout_data_{datetime.now().strftime("%Y%m%d")}.csv'
        )
    
    except Exception as e:
        logger.error(f"Error exporting data: {str(e)}")
        return redirect(url_for('dashboard'))

@app.route('/notifications')
def notifications():
    """Display workout reminder notifications."""
    notifications_list = get_all_notifications()
    return render_template('notifications.html', notifications=notifications_list)

@app.route('/notifications/generate-test')
def generate_test_notification():
    """Generate a test notification for demonstration."""
    from_email = "test@workout-tracker.com"
    to_email = "user@example.com"
    success = send_workout_reminder(to_email, from_email)
    
    if success:
        return redirect(url_for('notifications'))
    else:
        return "Failed to generate test notification", 500

@app.route('/form/email', methods=['GET'])
def from_email_link():
    """Handle form opened from email link."""
    # Redirect to the form with parameters from the email
    date = request.args.get('date', '')
    return redirect(url_for('workout_form', date=date))

@app.route('/api/workouts/<date>', methods=['GET'])
def get_workout_by_date(date):
    """API endpoint to retrieve a specific workout by date."""
    try:
        # Parse date
        workout_date = datetime.strptime(date, '%Y-%m-%d').date()
        
        # Query workout
        workout = Workout.query.filter_by(date=workout_date).first()
        
        if workout:
            return jsonify({
                'success': True,
                'workout': workout.to_dict()
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Workout not found'
            }), 404
    
    except ValueError:
        return jsonify({
            'success': False,
            'error': 'Invalid date format. Use YYYY-MM-DD.'
        }), 400
    
    except Exception as e:
        logger.error(f"Error retrieving workout: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
