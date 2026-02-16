/**
 * App Controller
 * Main entry point for application initialization
 */

import { initRouter, navigate } from '../core/router.js?v=1771261308121';
import { BASE_PATH } from '../core/config.js?v=1771261308121';
import { initTOCToggle } from '../views/tocView.js?v=1771261308121';
import { initTheme, toggleTheme } from './themeController.js?v=1771261308121';

/**
 * Initializes the entire application
 */
export function initializeApp() {
    console.log('[App] Initializing application...');

    // 1. Load theme
    initTheme();

    // 3. Set up event listeners
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // 4. Initialize Core Modules
    initRouter();
    initTOCToggle();
    initShareButton();

    // 5. Update UI elements
    updateNavbar();

    // 6. Initial Routing
    handleInitialRoute();
}

/**
 * Initializes the share button logic
 */
function initShareButton() {
    const shareBtn = document.getElementById('share-btn');
    if (!shareBtn) return;

    shareBtn.addEventListener('click', () => {
        const cleanUrl = decodeURIComponent(window.location.href);

        navigator.clipboard.writeText(cleanUrl).then(() => {
            shareBtn.classList.add('copied');
            showToast('Link Copied!', 'success');
            setTimeout(() => {
                shareBtn.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy URL:', err);
            showToast('Failed to copy link', 'error');
        });
    });
}

/**
 * Updates navbar elements (e.g., logo links)
 */
function updateNavbar() {
    const logo = document.querySelector('.navbar-logo');
    if (logo) {
        logo.href = (BASE_PATH || '') + '/';
    }
}

/**
 * Handles the first route on page load
 */
function handleInitialRoute() {
    const path = window.location.pathname;
    const hash = window.location.hash;

    if (hash.startsWith('#/')) {
        const newPath = hash.slice(1);
        history.replaceState(null, '', newPath);
        navigate(newPath);
    } else {
        // combine path + hash if it's a standard anchor
        navigate(path + hash);
    }
}

/**
 * Shows a global toast notification
 */
export function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${type === 'success' ? '✅' : '❌'}</span>
        <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    // Fade in
    setTimeout(() => toast.classList.add('show'), 100);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}
