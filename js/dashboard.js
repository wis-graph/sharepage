/**
 * Dashboard - Layered Architecture Entry Point
 */

import { initDashboardHandlers } from './controllers/dashboardController.js?v=41000';

// Initialize handlers when this module is loaded
initDashboardHandlers();

// Re-export common functions for backward compatibility
export { loadDashboardNotes } from './services/dashboardService.js?v=41000';
export { renderDashboardPage, renderFullDashboard } from './views/dashboardView.js?v=41000';

// Legacy pagination no-op
export async function goToPage(page) {
  console.warn('[Dashboard] Pagination ignored in sectioned view');
}
