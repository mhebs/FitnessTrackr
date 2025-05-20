# Workout Tracker

A full-stack web application for tracking your daily workouts with visualizations and reminders.

## Features

- **Daily Workout Reminders**: Get a daily reminder at 8:00 AM (US Eastern Time) with a pre-filled form
- **Workout Logging**: Record workout type, duration, and optional notes
- **Data Visualization Dashboard**: See your workout statistics and trends
- **Calendar Heatmap**: Visual representation of your workout history
- **Data Export**: Download your workout data as a CSV file
- **Rest Day Alerts**: Receive alerts if you've worked out for 7+ consecutive days without rest
- **Auto-Mark Rest Days**: System automatically marks days with no entry as rest days

## Setup Instructions

### Prerequisites

- Python 3.11+
- Flask
- SQLAlchemy
- APScheduler
- SQLite/PostgreSQL

### Health Features

The application includes health-focused features to ensure proper recovery and prevent injury:

- **Rest Day Detection**: The system automatically detects when you've exercised for 7 or more consecutive days without a rest day.
- **Rest Alerts**: When 7+ consecutive workout days are detected, a prominent warning appears on your dashboard recommending a rest day.
- **Auto-Fill Rest Days**: The system automatically marks days with no entry as "Rest" days at the end of each day.

### Environment Variables

Create a `.env` file in the root directory with the following variables:

