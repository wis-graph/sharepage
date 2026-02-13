// Migrated to use new layered modules
import { PAGINATION } from '../core/config.js?v=40000';
const PAGINATION_ITEMS_PER_PAGE = PAGINATION.ITEMS_PER_PAGE;

export function renderPagination(page, totalPages) {
  console.log('[Dashboard] Rendering pagination for page', page, 'of', totalPages);

  let html = '<div class="pagination">';

  if (page > 1) {
    html += `<button onclick="goToPage(${page - 1})">Previous</button>`;
  }

  for (let i = 1; i <= totalPages; i++) {
    html += `<button onclick="goToPage(${i})" ${i === page ? 'class="active"' : ''}>${i}</button>`;
  }

  if (page < totalPages) {
    html += `<button onclick="goToPage(${page + 1})">Next</button>`;
  }

  html += '</div>';
  return html;
}

export function shouldRenderPagination(totalPages) {
  return totalPages > 1;
}
