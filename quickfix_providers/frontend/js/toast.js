/**
 * Creates and displays a toast notification.
 * @param {string} message - The message to display.
 * @param {boolean} isError - Determines if it's an error (red) or success (green) toast.
 */
export function showToast(message, isError = false) {
    const container = document.getElementById('toast-container') || createToastContainer();

    const toast = document.createElement('div');
    toast.className = 'toast';
    if (isError) {
        toast.classList.add('error');
    }

    const icon = isError ? '❌' : '✅';

    toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close-btn">&times;</button>
    <div class="toast-progress-bar"></div>
  `;

    container.appendChild(toast);

    // Close button functionality
    toast.querySelector('.toast-close-btn').addEventListener('click', () => {
        toast.remove();
    });

    // Automatically remove toast after 3 seconds
    setTimeout(() => {
        if (toast) {
            toast.remove();
        }
    }, 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
    return container;
}
