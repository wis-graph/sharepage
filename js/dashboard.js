import { fetchFile } from './utils.js?v=13000';
import { loadSectionedDashboard } from './dashboard/dashboardDataExtractor.js?v=13000';
import { renderSectionedDashboard } from './dashboard/dashboardCardRenderer.js?v=13000';

let dashboardState = {
  dashboardContent: '',
  sections: []
};

export async function loadDashboardNotes() {
  console.log('[Dashboard] Initializing dashboard content...');

  try {
    // Renamed from _home.md to _dashboard.md
    const content = await fetchFile('_dashboard.md');
    dashboardState.dashboardContent = content;
    console.log('[Dashboard] _dashboard.md loaded');
  } catch (error) {
    console.error('[Dashboard] Error loading _dashboard.md:', error);
    dashboardState.dashboardContent = '';
  }
}

/**
 * Renders the structured dashboard view
 */
export async function renderDashboardPage() {
  console.log('[Dashboard] Rendering sectioned dashboard START');

  if (!dashboardState.dashboardContent) {
    return '<div class="loading">No content found in _dashboard.md. Please create it to organize your notes.</div>';
  }

  // Load all notes grouped by sections
  const sections = await loadSectionedDashboard(dashboardState.dashboardContent);

  if (sections.length === 0) {
    console.log('[Dashboard] No sections/links found');
    return '<div class="loading">No notes linked in _dashboard.md yet.</div>';
  }

  const sectionsHtml = renderSectionedDashboard(sections);

  console.log('[Dashboard] Rendering sectioned dashboard END');
  return sectionsHtml;
}

// Redirect goToPage to a no-op if called (pagination removed for sectioned view)
export async function goToPage(page) {
  console.warn('[Dashboard] Pagination ignored in sectioned view');
}
