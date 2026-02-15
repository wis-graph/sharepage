/**
 * App - Entry Point
 * Initializes the application after DOM is ready
 */

import { initializeApp } from './controllers/appController.js?v=1771154494809';

document.addEventListener('DOMContentLoaded', () => {
  // Check for critical libraries
  if (typeof hljs === 'undefined') {
    console.error('[App] Error: highlight.js is not loaded');
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = '<div class="error">Error: highlight.js failed to load. Please refresh the page.</div>';
    }
    return;
  }

  // Initialize
  initializeApp();
});
