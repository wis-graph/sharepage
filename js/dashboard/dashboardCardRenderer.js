import { prefetchFile } from '../utils.js?v=4900';

export function renderNoteThumbnail(note) {
  if (note.thumbnail) {
    console.log('[Card] Using thumbnail:', note.thumbnail);
    return `<img class="note-card-thumbnail" src="${note.thumbnail}" alt="${note.title}" loading="lazy">`;
  }

  console.log('[Card] Using placeholder');
  return `
    <div class="note-card-thumbnail-placeholder">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="9" y1="3" x2="9" y2="21" />
      </svg>
    </div>
  `;
}

export function renderNoteCard(note) {
  const thumbnailHtml = renderNoteThumbnail(note);

  const tagsHtml = note.tags && note.tags.length > 0
    ? `<div class="note-card-tags">
        ${note.tags.map(tag => `<span class="note-card-tag-pill">#${tag}</span>`).join('')}
       </div>`
    : '';

  return `
    <div class="note-card" 
         onclick="handleCardClick('${note.path}', this)" 
         onmouseenter="prefetchNote('${note.file}')">
      ${thumbnailHtml}
      <div class="note-card-content">
        <div class="note-card-title">${note.title}</div>
        ${tagsHtml}
        <div class="note-card-preview">${note.description}</div>
      </div>
    </div>
  `;
}

// Global helpers for interaction
window.prefetchNote = (file) => {
  prefetchFile(file);
};

window.handleCardClick = (path, el) => {
  // Add a quick feedback class
  el.classList.add('is-active');

  // Set shared transition names on key elements to help the browser "morph"
  const thumbnail = el.querySelector('.note-card-thumbnail, .note-card-thumbnail-placeholder');
  const title = el.querySelector('.note-card-title');

  if (thumbnail) thumbnail.style.viewTransitionName = 'active-note-thumbnail';
  if (title) title.style.viewTransitionName = 'active-note-expand';

  if (document.startViewTransition) {
    const transition = document.startViewTransition(() => {
      window.location.hash = path;
    });

    // Clean up style after transition finishes
    transition.finished.finally(() => {
      if (thumbnail) thumbnail.style.viewTransitionName = '';
      if (title) title.style.viewTransitionName = '';
    });
  } else {
    window.location.hash = path;
  }
};

export function renderCardGrid(notes) {
  console.log('[Dashboard] Rendering card grid with', notes.length, 'notes');

  const cardHtmls = notes.map(note => {
    console.log('[Dashboard] Rendering card for:', note.title, '(path:', note.path + ')');
    return renderNoteCard(note);
  });

  return `
    <div class="dashboard-grid">
      ${cardHtmls.join('')}
    </div>
  `;
}

export function renderSectionedDashboard(sections) {
  console.log('[Dashboard] Rendering sectioned dashboard with', sections.length, 'sections');

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
