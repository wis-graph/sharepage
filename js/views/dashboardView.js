/**
 * Dashboard View
 * Handles rendering logic for the dashboard
 */

import {
    getDashboardContent,
    getDashboardSections,
    setDashboardSections,
    setAllTags,
    getAllTags,
    getActiveTags,
    getSearchQuery
} from '../state/appState.js?v=41000';
import { loadSectionedDashboard } from '../dashboard/dashboardDataExtractor.js?v=41000';
import { renderSectionedDashboard, renderDashboardControls } from '../dashboard/dashboardCardRenderer.js?v=41000';
import { filterSections } from '../services/dashboardService.js?v=41000';

/**
 * Renders the structured dashboard view
 */
export async function renderDashboardPage() {
    console.log('[DashboardView] Rendering dashboard page START');

    const dashboardContent = getDashboardContent();
    if (!dashboardContent) {
        return '<div class="loading">No content found in _dashboard.md. Please create it to organize your notes.</div>';
    }

    const sections = await loadSectionedDashboard(dashboardContent);

    if (sections.length === 0) {
        return '<div class="loading">No notes linked in _dashboard.md yet.</div>';
    }

    // Extract all unique tags
    const allTags = new Set();
    sections.forEach(section => {
        section.notes.forEach(note => {
            if (note.tags) note.tags.forEach(t => allTags.add(t));
        });
    });

    // Update State
    setDashboardSections(sections);
    setAllTags(Array.from(allTags).sort());

    return renderFullDashboard();
}

/**
 * Builds the full dashboard HTML including controls and filtered sections
 */
export function renderFullDashboard() {
    const filteredSections = filterSections(
        getDashboardSections(),
        getSearchQuery(),
        getActiveTags()
    );

    const controlsHtml = renderDashboardControls(
        getAllTags(),
        getActiveTags(),
        getSearchQuery()
    );

    if (filteredSections.length === 0) {
        return `
      ${controlsHtml}
      <div class="empty-state">
        <p>No notes found matching your criteria.</p>
      </div>
    `;
    }

    const sectionsHtml = renderSectionedDashboard(filteredSections);

    return `
    ${controlsHtml}
    ${sectionsHtml}
  `;
}
