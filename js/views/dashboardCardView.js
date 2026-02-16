/**
 * Dashboard Card View
 * Handles rendering of note cards, grids, and dashboard controls
 */

import { prefetchFile } from '../core/fileApi.js?v=1771259473751';
import { navigate } from '../core/router.js?v=1771259473751';

const PREMIUM_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
  'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
  'linear-gradient(135deg, #00c6fb 0%, #005bea 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #5eeff9 0%, #4568dc 100%)',
  'linear-gradient(135deg, #f83600 0%, #f9d423 100%)',
  'linear-gradient(135deg, #b721ff 0%, #21d4fd 100%)',
  'linear-gradient(135deg, #09203f 0%, #537895 100%)',
  'linear-gradient(135deg, #0093e9 0%, #80d0c7 100%)'
];

/**
 * Returns a consistent gradient based on title string
 */
function getPremiumGradient(title) {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PREMIUM_GRADIENTS.length;
  return PREMIUM_GRADIENTS[index];
}

/**
 * Renders the thumbnail part of a card
 */
export function renderNoteThumbnail(note) {
  if (note.thumbnail) {
    return `<img class="note-card-thumbnail" src="${note.thumbnail}" alt="${note.title}" loading="lazy">`;
  }

  const gradient = getPremiumGradient(note.title);
  return `
    <div class="note-card-thumbnail-placeholder" style="background: ${gradient}">
      <div class="placeholder-title">${note.title}</div>
    </div>
  `;
}

/**
 * Renders a single note card
 */
export function renderNoteCard(note) {
  const thumbnailHtml = renderNoteThumbnail(note);
  const tagsHtml = note.tags && note.tags.length > 0
    ? `<div class="note-card-tags">
        ${note.tags.map(tag => `
          <button 
            class="note-card-tag-pill" 
            onclick="event.stopPropagation(); window.onDashboardTagToggle('${tag}')"
          >#${tag}</button>
        `).join('')}
       </div>`
    : '';

  return `
    <div class="note-card" 
         onclick="window.handleCardClick('${note.path}', this)" 
         onmouseenter="window.prefetchNote('${note.file}')">
      ${thumbnailHtml}
      <div class="note-card-content">
        <div class="note-card-title">${note.title}</div>
        ${tagsHtml}
        <div class="note-card-preview">${note.description}</div>
      </div>
    </div>
  `;
}

/**
 * Renders a section with cards
 */
export function renderSectionedDashboard(sections) {
  return sections.map(section => {
    const cardHtmls = section.notes.map(note => renderNoteCard(note));
    return `
      <section class="dashboard-section">
        <h2 class="section-header">
          <span class="section-title">${section.title}</span>
          <span class="section-count">${section.count}</span>
        </h2>
        <div class="dashboard-grid">
          ${cardHtmls.join('')}
        </div>
      </section>
    `;
  }).join('');
}

/**
 * Renders search and tag filter controls
 */
export function renderDashboardControls(allTags, activeTags, searchQuery) {
  const activeTagsSet = new Set(activeTags);
  const tagsHtml = allTags.map(tag => {
    const isActive = activeTagsSet.has(tag);
    return `
      <button 
        class="dashboard-tag-filter ${isActive ? 'active' : ''}" 
        onclick="window.onDashboardTagToggle('${tag}')">
        #${tag}
      </button>
    `;
  }).join('');

  return `
    <div class="dashboard-controls">
      <div class="dashboard-search-container">
        <input 
          type="text" 
          class="dashboard-search-input" 
          placeholder="Search notes..." 
          value="${searchQuery}"
          oninput="window.onDashboardSearch(this.value)"
        />
        <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 21L15.0001 15.0001M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="dashboard-tags-container">
        ${tagsHtml}
      </div>
    </div>
  `;
}

// Global Handlers
window.prefetchNote = (file) => prefetchFile(file);

window.handleCardClick = (path, el) => {
  el.classList.add('is-active');
  const thumbnail = el.querySelector('.note-card-thumbnail, .note-card-thumbnail-placeholder');
  const title = el.querySelector('.note-card-title');

  if (thumbnail) thumbnail.style.viewTransitionName = 'active-note-thumbnail';
  if (title) title.style.viewTransitionName = 'active-note-expand';

  const navigateTo = () => {
    const finalPath = path.startsWith('/') ? path : '/' + path;
    history.pushState(null, '', finalPath);
    navigate(finalPath);
  };

  if (document.startViewTransition) {
    const transition = document.startViewTransition(navigateTo);
    transition.finished.finally(() => {
      if (thumbnail) thumbnail.style.viewTransitionName = '';
      if (title) title.style.viewTransitionName = '';
    });
  } else {
    navigateTo();
  }
};
