/**
 * Dashboard Controller
 * Handles user interactions and events for the dashboard
 */

import {
    setSearchQuery,
    getSearchQuery,
    getDashboardSections,
    getActiveTags,
    addActiveTag,
    removeActiveTag
} from '../state/appState.js?v=1771734511011';
import { filterSections } from '../services/dashboardService.js?v=1771734511011';
import { renderSectionedDashboard } from '../views/dashboardCardView.js?v=1771734511011';
import { renderFullDashboard, updateDashboardResults } from '../views/dashboardView.js?v=1771734511011';
import { initDashboardAnimations } from '../views/animations.js?v=1771734511011';

/**
 * Global Event Handlers for Dashboard
 */
export function initDashboardHandlers() {
    window.onDashboardSearch = handleSearch;
    window.onDashboardTagToggle = handleTagToggle;
}

/**
 * Handles search input event
 * @param {string} value 
 */
function handleSearch(value) {
    setSearchQuery(value);

    const filteredSections = filterSections(
        getDashboardSections(),
        getSearchQuery(),
        getActiveTags()
    );

    let contentHtml = '';
    if (filteredSections.length === 0) {
        contentHtml = `
      <div class="empty-state">
        <p>No notes found matching your criteria.</p>
      </div>
    `;
    } else {
        contentHtml = renderSectionedDashboard(filteredSections);
    }

    const controls = document.querySelector('.dashboard-controls');

    if (controls) {
        updateDashboardResults(contentHtml, false);
        initDashboardAnimations();
    } else {
        // Full re-render fallback
        updateDashboardResults(renderFullDashboard(), true);

        // Maintain focus and cursor position after full re-render
        const input = document.querySelector('.dashboard-search-input');
        if (input) {
            input.focus();
            const val = input.value;
            input.value = '';
            input.value = val;
        }
    }
}

/**
 * Handles tag toggle event
 * @param {string} tag 
 */
function handleTagToggle(tag) {
    const activeTags = getActiveTags();
    const index = activeTags.indexOf(tag);

    if (index === -1) {
        addActiveTag(tag);
    } else {
        removeActiveTag(tag);
    }

    updateDashboardResults(renderFullDashboard(), true);
    initDashboardAnimations();
}
