/**
 * TOC View
 * Handles rendering of the Table of Contents and scroll highlighting
 */

import { extractTOC } from '../services/tocService.js?v=1771303380617';

const tocState = {
    currentScrollObserver: null
};

/**
 * Renders the Table of Contents into the sidebar
 */
export function renderTOC() {
    const tocContainer = document.getElementById('toc-content');
    const tocSidebar = document.getElementById('toc-sidebar');

    if (!tocContainer || !tocSidebar) return { success: false };

    const items = extractTOC();

    if (items.length === 0) {
        tocSidebar.classList.remove('visible');
        tocContainer.innerHTML = '';
        return { success: true, itemsCount: 0 };
    }

    tocSidebar.classList.add('visible');
    tocContainer.innerHTML = generateTOCHTML(items);

    bindTOCClickEvents();
    return { success: true, itemsCount: items.length };
}

/**
 * Generates HTML for the TOC list
 */
function generateTOCHTML(items) {
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

/**
 * Binds click events for smooth scrolling
 */
function bindTOCClickEvents() {
    const tocContainer = document.getElementById('toc-content');
    const tocSidebar = document.getElementById('toc-sidebar');

    if (!tocContainer) return;

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
}

/**
 * Highlights the active item in the TOC sidebar
 */
export function highlightActiveTOCItem(id) {
    document.querySelectorAll('.toc-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.target === id) {
            link.classList.add('active');

            // Auto-scroll sidebar if needed
            const sidebar = document.getElementById('toc-sidebar');
            if (sidebar && sidebar.classList.contains('visible')) {
                const linkRect = link.getBoundingClientRect();
                const sidebarRect = sidebar.getBoundingClientRect();

                if (linkRect.top < sidebarRect.top || linkRect.bottom > sidebarRect.bottom) {
                    link.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }
            }
        }
    });
}

/**
 * Sets up the scroll observer for TOC highlighting
 */
export function initScrollHighlight() {
    stopScrollHighlight();

    const headings = document.querySelectorAll('.document-container h1, h2, h3, h4');
    if (headings.length === 0) return;

    const observerOptions = {
        rootMargin: '-100px 0px -80% 0px',
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                highlightActiveTOCItem(entry.target.id);
            }
        });
    }, observerOptions);

    headings.forEach(heading => observer.observe(heading));
    tocState.currentScrollObserver = observer;
}

/**
 * Disconnects the scroll observer
 */
export function stopScrollHighlight() {
    if (tocState.currentScrollObserver) {
        tocState.currentScrollObserver.disconnect();
        tocState.currentScrollObserver = null;
    }
}

/**
 * Initializes the mobile TOC toggle button
 */
export function initTOCToggle() {
    const toggle = document.getElementById('toc-toggle');
    const sidebar = document.getElementById('toc-sidebar');

    if (!toggle || !sidebar) return { success: false };

    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.toggle('open');
    });

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
