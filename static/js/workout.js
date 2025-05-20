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
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});

/**
 * HTMX after swap event handler
 * Handles any UI updates after HTMX swaps content
 */
document.body.addEventListener('htmx:afterSwap', function(event) {
    // Re-initialize tooltips after content swap
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
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
