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
} from '../state/appState.js?v=41000';
import { filterSections } from '../services/dashboardService.js?v=41000';
import { renderSectionedDashboard } from '../dashboard/dashboardCardRenderer.js?v=41000';
import { renderFullDashboard } from '../views/dashboardView.js?v=41000';
import { initDashboardAnimations } from '../animations.js?v=41000';

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

    const app = document.getElementById('app');
    if (!app) return;

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
        // Partial DOM update for better performance
        while (controls.nextElementSibling) {
            controls.nextElementSibling.remove();
        }
        controls.insertAdjacentHTML('afterend', contentHtml);
        initDashboardAnimations();
    } else {
        // Full re-render fallback
        app.innerHTML = renderFullDashboard();

        // Maintain focus and cursor position
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

    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = renderFullDashboard();
        initDashboardAnimations();
    }
}
