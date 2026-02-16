/**
 * App Controller
 * Main entry point for application initialization
 */

import { initRouter, navigate } from '../core/router.js?v=1771249886853';
import { BASE_PATH } from '../core/config.js?v=1771249886853';
import { initTOCToggle } from '../views/tocView.js?v=1771249886853';
import { initTheme, toggleTheme } from './themeController.js?v=1771249886853';

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

    // 5. Update UI elements
    updateNavbar();

    // 6. Initial Routing
    handleInitialRoute();
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
