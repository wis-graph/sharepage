import { fetchFile } from './utils.js?v=37000';
import { loadSectionedDashboard } from './dashboard/dashboardDataExtractor.js?v=37000';
import { renderSectionedDashboard, renderDashboardControls } from './dashboard/dashboardCardRenderer.js?v=37000';
import { initDashboardAnimations } from './animations.js?v=37000';

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

  /* Extract all unique tags */
  const allTags = new Set();
  sections.forEach(section => {
    section.notes.forEach(note => {
      if (note.tags) note.tags.forEach(t => allTags.add(t));
    });
  });

  // Update State
  dashboardState.sections = sections;
  dashboardState.allTags = Array.from(allTags).sort();
  dashboardState.activeTags = [];
  dashboardState.searchQuery = '';

  return renderFullDashboard();
}

function filterSections(sections, query, activeTags) {
  if (!query && activeTags.length === 0) return sections;

  const lowerQuery = query.toLowerCase();
  const activeTagsSet = new Set(activeTags);

  return sections.map(section => {
    const filteredNotes = section.notes.filter(note => {
      // 1. Search Query Filter
      const matchesQuery = !query ||
        note.title.toLowerCase().includes(lowerQuery) ||
        (note.description && note.description.toLowerCase().includes(lowerQuery));

      if (!matchesQuery) return false;

      // 2. Tag Filter (OR Logic)
      if (activeTags.length > 0) {
        if (!note.tags || note.tags.length === 0) return false;
        // Check if note has ANY of the active tags
        const hasTag = note.tags.some(tag => activeTagsSet.has(tag));
        if (!hasTag) return false;
      }

      return true;
    });

    return {
      ...section,
      notes: filteredNotes,
      count: filteredNotes.length
    };
  }).filter(section => section.notes.length > 0);
}

function renderFullDashboard() {
  const filteredSections = filterSections(
    dashboardState.sections,
    dashboardState.searchQuery,
    dashboardState.activeTags
  );

  const controlsHtml = renderDashboardControls(
    dashboardState.allTags,
    dashboardState.activeTags,
    dashboardState.searchQuery
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

  console.log('[Dashboard] Rendering sectioned dashboard END');
  return `
    ${controlsHtml}
    ${sectionsHtml}
  `;
}

// Global Event Handlers
window.onDashboardSearch = (value) => {
  dashboardState.searchQuery = value;

  const app = document.getElementById('app');
  if (!app) return;

  const filteredSections = filterSections(
    dashboardState.sections,
    dashboardState.searchQuery,
    dashboardState.activeTags
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
    // Remove everything after controls
    while (controls.nextElementSibling) {
      controls.nextElementSibling.remove();
    }
    // Append new content
    controls.insertAdjacentHTML('afterend', contentHtml);

    // Re-initialize animations for new cards
    initDashboardAnimations();
  } else {
    // Fallback
    app.innerHTML = renderFullDashboard();
    const input = document.querySelector('.dashboard-search-input');
    if (input) {
      input.focus();
      const val = input.value;
      input.value = '';
      input.value = val;
    }
  }
};

window.onDashboardTagToggle = (tag) => {
  const index = dashboardState.activeTags.indexOf(tag);
  if (index === -1) {
    dashboardState.activeTags.push(tag);
  } else {
    dashboardState.activeTags.splice(index, 1);
  }

  const app = document.getElementById('app');
  if (app) app.innerHTML = renderFullDashboard();
};

// Redirect goToPage to a no-op if called (pagination removed for sectioned view)
export async function goToPage(page) {
  console.warn('[Dashboard] Pagination ignored in sectioned view');
}
