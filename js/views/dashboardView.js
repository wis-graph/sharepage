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
} from '../state/appState.js?v=1771152090760';
import { loadSectionedDashboard } from '../services/dashboardDataService.js?v=1771152090760';
import { renderSectionedDashboard, renderDashboardControls } from './dashboardCardView.js?v=1771152090760';
import { filterSections } from '../services/dashboardService.js?v=1771152090760';

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

/**
 * Updates the dashboard search results in the DOM
 * @param {string} contentHtml - The new HTML for the results
 * @param {boolean} isFullRender - Whether to re-render the entire app container
 */
export function updateDashboardResults(contentHtml, isFullRender = false) {
    const app = document.getElementById('app');
    if (!app) return;

    if (isFullRender) {
        app.innerHTML = contentHtml;
        // Maintain search focus if needed (handled by caller if specific)
        return;
    }

    const controls = document.querySelector('.dashboard-controls');
    if (controls) {
        // Remove everything after controls and insert new content
        while (controls.nextElementSibling) {
            controls.nextElementSibling.remove();
        }
        controls.insertAdjacentHTML('afterend', contentHtml);
    } else {
        // Fallback to full render if controls not found
        app.innerHTML = renderFullDashboard();
    }
}
