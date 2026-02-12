import { fetchFile, PAGINATION_ITEMS_PER_PAGE } from './utils.js';
import { loadPageNotes } from './dashboard/dashboardDataExtractor.js';
import { renderCardGrid } from './dashboard/dashboardCardRenderer.js';
import { renderPagination, shouldRenderPagination } from './dashboard/dashboardPagination.js';

let dashboardState = {
  currentPage: 1,
  dashboardContent: '',
  totalLinks: 0
};

export async function loadDashboardNotes() {
  console.log('[Dashboard] Initializing dashboard content...');

  try {
    const content = await fetchFile('_home.md');
    dashboardState.dashboardContent = content;
    console.log('[Dashboard] _home.md loaded');
  } catch (error) {
    console.error('[Dashboard] Error loading _home.md:', error);
    dashboardState.dashboardContent = '';
  }
}

export async function renderDashboardPage(page) {
  console.log('[Dashboard] ===== Rendering dashboard page', page, 'START =====');

  if (!dashboardState.dashboardContent) {
    return '<div class="loading">No content found in _home.md.</div>';
  }

  // Load only the notes for the current page
  const result = await loadPageNotes(
    dashboardState.dashboardContent,
    page,
    PAGINATION_ITEMS_PER_PAGE
  );

  if (result.notes.length === 0) {
    console.log('[Dashboard] No notes found for this page');
    return '<div class="loading">No notes found.</div>';
  }

  const totalPages = Math.ceil(result.totalLinks / PAGINATION_ITEMS_PER_PAGE);
  const cardGridHtml = renderCardGrid(result.notes);
  let html = cardGridHtml;

  if (shouldRenderPagination(totalPages)) {
    html += renderPagination(page, totalPages);
  }

  console.log('[Dashboard] ===== Rendering dashboard page', page, 'END =====');
  return html;
}

export async function goToPage(page) {
  dashboardState.currentPage = page;
  document.getElementById('app').innerHTML = '<div class="loading-container"><div class="spinner"></div><div class="loading-text">Loading Page ' + page + '</div></div>';

  const html = await renderDashboardPage(page);
  document.getElementById('app').innerHTML = html;
  window.scrollTo(0, 0);
}
