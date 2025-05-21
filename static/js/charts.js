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
            }
        })
        .catch(error => console.error('Error fetching workout data:', error));
});
