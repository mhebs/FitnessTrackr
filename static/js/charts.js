/**
 * Workout Tracker Charts
 * Uses Chart.js to render workout visualizations
 */

// Create a horizontal bar chart showing workout count by type
function createWorkoutTypeChart(elementId, data) {
    const ctx = document.getElementById(elementId).getContext('2d');
    
    // Extract workout types and counts
    const workoutTypes = Object.keys(data);
    const counts = Object.values(data);
    
    // Define colors for each workout type
    const colors = {
        'Yoga': '#8e24aa',           // purple
        'Pilates': '#2196f3',        // blue
        'Strength Training': '#f44336', // red
        'Cardio': '#4caf50',         // green
        'Rest': '#9e9e9e'            // grey
    };
    
    // Get colors for each workout type
    const backgroundColor = workoutTypes.map(type => colors[type] || '#607d8b');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: workoutTypes,
            datasets: [{
                label: 'Number of Workouts',
                data: counts,
                backgroundColor: backgroundColor,
                borderColor: backgroundColor,
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.x} workout(s)`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Create a pie chart showing active vs rest days
function createActivityPieChart(elementId, activeCount, restCount) {
    const ctx = document.getElementById(elementId).getContext('2d');
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Active Days', 'Rest Days'],
            datasets: [{
                data: [activeCount, restCount],
                backgroundColor: ['#4caf50', '#9e9e9e'],
                borderColor: 'rgba(0, 0, 0, 0.1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Update the calendar heatmap based on workout data
function updateCalendarHeatmap(workouts) {
    const container = document.getElementById('calendar-heatmap');
    container.innerHTML = ''; // Clear existing content
    
    // Get current date and determine the first day of the year
    const today = new Date();
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
    
    // Calculate the first Sunday before or on January 1st
    const dayOfWeek = firstDayOfYear.getDay(); // 0 = Sunday, 6 = Saturday
    const startDate = new Date(firstDayOfYear);
    startDate.setDate(firstDayOfYear.getDate() - dayOfWeek);
    
    // Determine the number of days to display (enough to reach today)
    const daysBetween = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
    const numWeeks = Math.ceil(daysBetween / 7);
    
    // Convert workouts array to a map for easy lookup
    const workoutMap = {};
    workouts.forEach(workout => {
        workoutMap[workout.date] = workout;
    });
    
    // Create calendar days
    for (let i = 0; i < numWeeks * 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        // Skip future dates
        if (currentDate > today) continue;
        
        const dateString = currentDate.toISOString().split('T')[0];
        const workout = workoutMap[dateString];
        
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.title = dateString;
        
        // Determine day class based on workout data
        if (workout) {
            if (workout.workout_type === 'Rest') {
                dayElement.classList.add('rest');
            } else {
                dayElement.classList.add('active');
            }
            // Add tooltip data
            dayElement.setAttribute('data-bs-toggle', 'tooltip');
            dayElement.setAttribute('data-bs-placement', 'top');
            dayElement.setAttribute('data-bs-title', `${dateString}: ${workout.workout_type}, ${workout.duration} min`);
        } else {
            dayElement.classList.add('empty');
        }
        
        // Add the day number
        dayElement.textContent = currentDate.getDate();
        
        // Add click handler to open the form for this date
        dayElement.addEventListener('click', () => {
            window.location.href = `/form?date=${dateString}`;
        });
        
        container.appendChild(dayElement);
    }
    
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Initialize all charts when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Fetch workout data and initialize charts
    fetch('/api/workouts')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const workouts = data.workouts;
                
                // Count workouts by type
                const workoutTypeCount = {};
                workouts.forEach(workout => {
                    const type = workout.workout_type;
                    workoutTypeCount[type] = (workoutTypeCount[type] || 0) + 1;
                });
                
                // Count active vs rest days
                const activeCount = workouts.filter(w => w.workout_type !== 'Rest').length;
                const restCount = workouts.filter(w => w.workout_type === 'Rest').length;
                
                // Initialize charts
                createWorkoutTypeChart('workout-type-chart', workoutTypeCount);
                createActivityPieChart('activity-pie-chart', activeCount, restCount);
                updateCalendarHeatmap(workouts);
                
                // Update stats
                document.getElementById('total-workouts-ytd').textContent = workouts.length;
                
                // Calculate current week workouts
                const today = new Date();
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
                startOfWeek.setHours(0, 0, 0, 0);
                
                const currentWeekWorkouts = workouts.filter(workout => {
                    const workoutDate = new Date(workout.date);
                    return workoutDate >= startOfWeek;
                });
                
                document.getElementById('workouts-this-week').textContent = currentWeekWorkouts.length;
            }
        })
        .catch(error => {
            console.error('Error fetching workout data:', error);
        });
});
