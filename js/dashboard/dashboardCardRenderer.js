import { prefetchFile, BASE_PATH, IS_LOCAL } from '../utils.js?v=12000';
import { navigate } from '../router.js?v=12000';

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

function getPremiumGradient(title) {
  // Simple hash for consistent coloring per title
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PREMIUM_GRADIENTS.length;
  return PREMIUM_GRADIENTS[index];
}

export function renderNoteThumbnail(note) {
  if (note.thumbnail) {
    console.log('[Card] Using thumbnail:', note.thumbnail);
    return `<img class="note-card-thumbnail" src="${note.thumbnail}" alt="${note.title}" loading="lazy">`;
  }

  const gradient = getPremiumGradient(note.title);
  console.log('[Card] Using gradient placeholder');
  return `
    <div class="note-card-thumbnail-placeholder" style="background: ${gradient}">
      <div class="placeholder-title">${note.title}</div>
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

  const navigateTo = () => {
    const finalPath = (BASE_PATH || '') + (path.startsWith('/') ? '' : '/') + path;

    history.pushState(null, '', finalPath);
    navigate(finalPath);
  };

  if (document.startViewTransition) {
    const transition = document.startViewTransition(navigateTo);

    // Clean up style after transition finishes
    transition.finished.finally(() => {
      if (thumbnail) thumbnail.style.viewTransitionName = '';
      if (title) title.style.viewTransitionName = '';
    });
  } else {
    navigateTo();
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
