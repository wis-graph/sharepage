import { slugify } from './utils.js?v=37000';

console.log('[TOC] Module loaded');

export function addHeadingIds(html) {
  console.log('[TOC] Adding heading IDs and anchors');
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const headings = doc.querySelectorAll('h1, h2, h3, h4');
  console.log('[TOC] Found headings:', headings.length);

  const idCounts = {};

  headings.forEach((heading) => {
    const level = parseInt(heading.tagName[1]);
    const text = heading.textContent;
    let id = slugify(text);

    // Ensure unique ID
    if (idCounts[id]) {
      idCounts[id]++;
      id = `${id}-${idCounts[id]}`;
    } else {
      idCounts[id] = 1;
    }

    heading.id = id;
    console.log('[TOC] Added ID:', id, '(h' + level + ')');

    const wrapper = document.createElement('div');
    wrapper.className = 'markdown-heading-wrapper';
    const anchor = document.createElement('a');
    anchor.href = '#' + id;
    anchor.className = 'heading-anchor';
    anchor.innerHTML = '#';
    wrapper.appendChild(anchor);

    heading.parentNode.insertBefore(wrapper, heading);
    wrapper.appendChild(heading);
  });

  return doc.body.innerHTML;
}

function extractTOC() {
  const tocItems = [];
  const headings = document.querySelectorAll('.document-container h1, h2, h3, h4');

  console.log('[TOC] Extracting TOC from DOM, found:', headings.length);

  headings.forEach((heading) => {
    const level = parseInt(heading.tagName[1]);
    const text = heading.textContent;
    const id = heading.id;

    tocItems.push({ level, text, id });
  });

  return tocItems;
}

function generateTOCHTML(items) {
  if (items.length === 0) {
    return '<p class="toc-empty">No headings found</p>';
  }

  let html = '<div class="toc-title">Table of Contents</div>';
  html += '<ul class="toc-list">';

  items.forEach((item) => {
    html += `
      <li class="toc-item">
        <a href="#${item.id}" class="toc-link level-${item.level}" data-target="${item.id}">
          ${item.text}
        </a>
      </li>
    `;
  });

  html += '</ul>';
  return html;
}

export function renderTOC() {
  const tocContainer = document.getElementById('toc-content');
  const tocSidebar = document.getElementById('toc-sidebar');

  if (!tocContainer || !tocSidebar) {
    console.warn('[TOC] TOC container or sidebar not found');
    return { success: false, reason: 'Elements not found' };
  }

  console.log('[TOC] Rendering TOC');
  const items = extractTOC();

  if (items.length === 0) {
    console.log('[TOC] No headings found, hiding sidebar');
    tocSidebar.classList.remove('visible');
    tocContainer.innerHTML = '';
    return { success: true, itemsCount: 0 };
  }

  tocSidebar.classList.add('visible');
  tocContainer.innerHTML = generateTOCHTML(items);

  const bindResult = bindTOCClickEvents();
  console.log('[TOC] TOC rendered with', items.length, 'items');

  return { success: bindResult.success, itemsCount: items.length };
}

function bindTOCClickEvents() {
  const tocContainer = document.getElementById('toc-content');
  const tocSidebar = document.getElementById('toc-sidebar');

  if (!tocContainer) {
    console.warn('[TOC] TOC container not found for event binding');
    return { success: false, reason: 'Container not found' };
  }

  tocContainer.querySelectorAll('.toc-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href');
      const targetId = href.startsWith('#') ? href.slice(1) : href;
      const target = document.getElementById(targetId);

      if (target) {
        const yOffset = -80;
        const y = target.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });

        if (window.innerWidth <= 1300 && tocSidebar) {
          tocSidebar.classList.remove('open');
        }
      }
    });
  });

  return { success: true };
}

const tocState = {
  currentScrollObserver: null
};

function highlightActiveTOCItem(id) {
  document.querySelectorAll('.toc-link').forEach(link => {
    link.classList.remove('active');
    if (link.dataset.target === id) {
      link.classList.add('active');

      // Auto-scroll safely
      const sidebar = document.getElementById('toc-sidebar');
      if (sidebar && sidebar.classList.contains('visible')) {
        const linkRect = link.getBoundingClientRect();
        const sidebarRect = sidebar.getBoundingClientRect();

        // Check if link is outside viewable area of sidebar
        if (linkRect.top < sidebarRect.top || linkRect.bottom > sidebarRect.bottom) {
          link.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
    }
  });
}

function createScrollObserver() {
  const headings = document.querySelectorAll('.document-container h1, h2, h3, h4');

  if (headings.length === 0) {
    console.log('[TOC] No headings found, skipping scroll observer');
    return null;
  }

  console.log('[TOC] Creating scroll observer for', headings.length, 'headings');

  const observerOptions = {
    rootMargin: '-100px 0px -80% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        highlightActiveTOCItem(id);
      }
    });
  }, observerOptions);

  headings.forEach(heading => {
    observer.observe(heading);
  });

  return observer;
}

export function stopScrollHighlight() {
  if (tocState.currentScrollObserver) {
    tocState.currentScrollObserver.disconnect();
    Object.assign(tocState, { currentScrollObserver: null });
    console.log('[TOC] Stopped scroll observer');
  }
}

export function initScrollHighlight() {
  console.log('[TOC] Initializing scroll highlight');
  stopScrollHighlight();
  const observer = createScrollObserver();
  Object.assign(tocState, { currentScrollObserver: observer });
}

export function initTOCToggle() {
  const toggle = document.getElementById('toc-toggle');
  const sidebar = document.getElementById('toc-sidebar');

  if (!toggle || !sidebar) {
    console.warn('[TOC] Toggle button or sidebar not found');
    return { success: false, reason: 'Elements not found' };
  }

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    sidebar.classList.toggle('open');
  });

  // Close sidebar when clicking outside (on backdrop or document)
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 1300 &&
      sidebar.classList.contains('open') &&
      !sidebar.contains(e.target) &&
      e.target !== toggle) {
      sidebar.classList.remove('open');
    }
  });

  return { success: true };
}
