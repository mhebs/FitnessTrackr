import os
import logging
from datetime import datetime, date, timedelta
from models import Workout

logger = logging.getLogger(__name__)

def get_current_week_workouts():
    """Get workouts for the current week (Sunday to Saturday)."""
    today = date.today()
    start_of_week = today - timedelta(days=today.weekday() + 1)  # Sunday
    end_of_week = start_of_week + timedelta(days=6)  # Saturday
    
    workouts = Workout.query.filter(
        Workout.date >= start_of_week,
        Workout.date <= end_of_week
    ).all()
    
    return workouts

def get_year_to_date_workouts():
    """Get all workouts for the current year."""
    start_of_year = date(date.today().year, 1, 1)
    
    workouts = Workout.query.filter(
        Workout.date >= start_of_year,
        Workout.date <= date.today()
    ).all()
    
    return workouts

def calculate_streak(workouts):
    """Calculate the current streak of consecutive workout days."""
    if not workouts:
        return 0
    
    # Sort workouts by date
    sorted_workouts = sorted(workouts, key=lambda w: w.date, reverse=True)
    
    # Start with the most recent workout
    streak = 1
    current_date = sorted_workouts[0].date
    
    # Check each previous day
    for i in range(1, len(sorted_workouts)):
        expected_date = current_date - timedelta(days=1)
        if sorted_workouts[i].date == expected_date:
            streak += 1
            current_date = expected_date
        else:
            # Streak broken
            break
    
    return streak

def get_total_workout_hours(workouts):
    """Calculate total workout hours from given workouts."""
    total_minutes = sum(workout.duration for workout in workouts)
    return round(total_minutes / 60.0, 1)  # Convert to hours and round to 1 decimal

def get_workout_type_distribution(workouts):
    """Get distribution of workout types."""
    distribution = {}
    
    for workout in workouts:
        workout_type = workout.workout_type
        if workout_type in distribution:
            distribution[workout_type] += 1
        else:
            distribution[workout_type] = 1
    
    return distribution

def get_active_vs_rest_counts(workouts):
    """Get count of active vs rest days."""
    active_count = sum(1 for workout in workouts if workout.workout_type != 'Rest')
    rest_count = sum(1 for workout in workouts if workout.workout_type == 'Rest')
    
    return active_count, rest_count

def check_consecutive_no_rest(workouts, days=7):
    """
    Check if there are 'days' or more consecutive workouts without a rest day.
    
    Args:
        workouts: List of Workout objects, sorted by date
        days: Number of consecutive days to check for (default: 7)
        
    Returns:
        Boolean: True if there are 'days' consecutive workouts without rest
    """
    if not workouts:
        return False
    
    # Sort workouts by date
    sorted_workouts = sorted(workouts, key=lambda w: w.date)
    
    # Check for consecutive active days
    consecutive_active = 0
    for workout in sorted_workouts:
        if workout.workout_type != 'Rest':
            consecutive_active += 1
            if consecutive_active >= days:
                return True
        else:
            # Reset counter when a rest day is found
            consecutive_active = 0
            
    return False
