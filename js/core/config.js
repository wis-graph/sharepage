/**
 * Core Configuration
 * Centralized constants - NEW MODULE, does not affect existing code
 */

// Environment Detection
export const IS_LOCAL = ['localhost', '127.0.0.1'].includes(window.location.hostname);

// Base Path Calculation
export const BASE_PATH = (() => {
    if (IS_LOCAL) return '';
    const parts = window.location.pathname.split('/');
    const path = '/' + parts[1];
    return (path === '/' || path === '/404.html') ? '' : path;
})();

// Path Configuration
export const PATHS = {
    NOTE_PREFIX: 'posts',
    NOTES_DIR: 'notes',
    IMAGES_DIR: 'images',
    DASHBOARD_FILE: '_dashboard.md'
};

// Pagination
export const PAGINATION = {
    ITEMS_PER_PAGE: 9
};

// Version
export const VERSION = '40000';
