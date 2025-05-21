/**
 * Workout Tracker Frontend JavaScript
 * Handles form submission and interactions
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize date picker with yesterday's date as default
    const dateInput = document.getElementById('workout-date');
    if (dateInput) {
        // Get date from URL parameter or use yesterday's date
        const urlParams = new URLSearchParams(window.location.search);
        const dateParam = urlParams.get('date');
        
        if (dateParam) {
            dateInput.value = dateParam;
        } else {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            dateInput.value = yesterday.toISOString().split('T')[0];
        }
    }
    
    // Handle form submission with HTMX
    const form = document.getElementById('workout-form');
    if (form) {
        form.addEventListener('htmx:afterSwap', function(event) {
            // Check if the response contains a success message
            if (event.detail.xhr.response.includes('success-message')) {
                // Redirect to dashboard after a short delay
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            }
        });
    }
    
    // Handle export button
    const exportBtn = document.getElementById('export-data-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            window.location.href = '/export';
        });
    }
    
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });

    // Fetch workout data and update UI
    fetch('/api/workouts')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateDashboardStats(data.workouts);
                updateCalendarHeatmap(data.workouts);
            }
        })
        .catch(error => console.error('Error fetching workouts:', error));

    const workoutTypeSelect = document.getElementById('workout-type');
    const durationField = document.getElementById('duration-field');
    const notesField = document.getElementById('workout-notes');
    
    workoutTypeSelect.addEventListener('change', function() {
        if (this.value === 'Rest') {
            durationField.style.display = 'none';
            document.getElementById('workout-duration').value = 0;
        } else {
            durationField.style.display = 'block';
            if (document.getElementById('workout-duration').value === '0') {
                document.getElementById('workout-duration').value = '';
            }
        }
    });
    
    // Check URL parameters for pre-filled values
    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get('workout_type');
    const durationParam = urlParams.get('duration');
    const notesParam = urlParams.get('notes');
    
    if (typeParam) {
        workoutTypeSelect.value = typeParam;
        // Trigger change event
        const event = new Event('change');
        workoutTypeSelect.dispatchEvent(event);
    }
    
    if (durationParam) {
        document.getElementById('workout-duration').value = durationParam;
    }
    
    if (notesParam) {
        notesField.value = decodeURIComponent(notesParam);
    }
});

/**
 * HTMX after swap event handler
 * Handles any UI updates after HTMX swaps content
 */
document.body.addEventListener('htmx:afterSwap', function(event) {
    // Re-initialize tooltips after content swap
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });
});

/**
 * Validate workout form before submission
 */
function validateWorkoutForm() {
    const date = document.getElementById('workout-date').value;
    const workoutType = document.getElementById('workout-type').value;
    const duration = document.getElementById('workout-duration').value;
    
    if (!date) {
        alert('Please select a date');
        return false;
    }
    
    if (!workoutType) {
        alert('Please select a workout type');
        return false;
    }
    
    if (workoutType !== 'Rest' && (!duration || duration <= 0)) {
        alert('Please enter a valid duration');
        return false;
    }
    
    return true;
}

function updateDashboardStats(workouts) {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

    // Calculate stats
    const workoutsYTD = workouts.filter(w => new Date(w.date) >= startOfYear).length;
    const workoutsThisWeek = workouts.filter(w => new Date(w.date) >= startOfWeek).length;
    const totalHours = Math.round(workouts.reduce((acc, w) => acc + (w.duration || 0), 0) / 60);

    // Calculate streak
    let currentStreak = 0;
    const sortedDates = workouts
        .map(w => w.date)
        .sort((a, b) => new Date(b) - new Date(a));

    if (sortedDates.length > 0) {
        let lastDate = new Date(sortedDates[0]);
        currentStreak = 1;

        for (let i = 1; i < sortedDates.length; i++) {
            const currentDate = new Date(sortedDates[i]);
            const dayDiff = Math.floor((lastDate - currentDate) / (1000 * 60 * 60 * 24));
            
            if (dayDiff === 1) {
                currentStreak++;
                lastDate = currentDate;
            } else {
                break;
            }
        }
    }

    // Update UI
    document.getElementById('total-workouts-ytd').textContent = workoutsYTD;
    document.getElementById('workouts-this-week').textContent = workoutsThisWeek;
    document.getElementById('current-streak').textContent = currentStreak;
    document.getElementById('total-hours').textContent = totalHours;
}

function updateCalendarHeatmap(workouts) {
    const heatmap = document.getElementById('calendar-heatmap');
    if (!heatmap) return;

    // Clear existing calendar
    heatmap.innerHTML = '';

    // Get current date
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // Create a map of workouts by date for easy lookup
    const workoutMap = new Map(workouts.map(w => [w.date, w]));

    // Month names
    const monthNames = [
        'January', 'February', 'March', 'April',
        'May', 'June', 'July', 'August',
        'September', 'October', 'November', 'December'
    ];

    // Day names
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Create month containers
    for (let month = 0; month < 12; month++) {
        const monthContainer = document.createElement('div');
        monthContainer.className = 'month-container';
        if (month > currentMonth) {
            monthContainer.classList.add('month-disabled');
        }

        // Add month header
        const monthHeader = document.createElement('div');
        monthHeader.className = 'month-header';
        monthHeader.textContent = monthNames[month];
        monthContainer.appendChild(monthHeader);

        // Create days container
        const daysContainer = document.createElement('div');
        daysContainer.className = 'month-days';

        // Add day labels
        dayNames.forEach(day => {
            const dayLabel = document.createElement('div');
            dayLabel.className = 'day-label';
            dayLabel.textContent = day[0]; // First letter only
            daysContainer.appendChild(dayLabel);
        });

        // Get first day of month and number of days in month
        const firstDay = new Date(currentYear, month, 1);
        const lastDay = new Date(currentYear, month + 1, 0);
        const numDays = lastDay.getDate();

        // Add empty cells for days before the first of the month
        for (let i = 0; i < firstDay.getDay(); i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day disabled';
            daysContainer.appendChild(emptyDay);
        }

        // Add days of the month
        for (let day = 1; day <= numDays; day++) {
            const currentDate = new Date(currentYear, month, day);
            const dateStr = currentDate.toISOString().split('T')[0];
            const workout = workoutMap.get(dateStr);

            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;

            // Disable future dates
            if (currentDate > today) {
                dayElement.classList.add('disabled');
            } else {
                if (workout) {
                    dayElement.classList.add(workout.workout_type === 'Rest' ? 'rest' : 'active');
                    dayElement.setAttribute('data-bs-toggle', 'tooltip');
                    dayElement.setAttribute('data-bs-placement', 'top');
                    
                    // Create detailed tooltip content
                    let tooltipContent = `${workout.workout_type}`;
                    if (workout.duration) {
                        tooltipContent += `, ${workout.duration} min`;
                    }
                    if (workout.notes) {
                        tooltipContent += `\n${workout.notes}`;
                    }
                    dayElement.setAttribute('data-bs-title', tooltipContent);

                    // Add click handler with workout data
                    dayElement.addEventListener('click', () => {
                        window.location.href = `/form?date=${dateStr}&workout_type=${encodeURIComponent(workout.workout_type)}&duration=${workout.duration || 0}${workout.notes ? '&notes=' + encodeURIComponent(workout.notes) : ''}`;
                    });
                } else {
                    dayElement.classList.add('empty');
                    // Add click handler for empty days
                    dayElement.addEventListener('click', () => {
                        window.location.href = `/form?date=${dateStr}`;
                    });
                }
            }

            daysContainer.appendChild(dayElement);
        }

        monthContainer.appendChild(daysContainer);
        heatmap.appendChild(monthContainer);
    }

    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}
