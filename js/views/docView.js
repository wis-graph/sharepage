/**
 * Document View
 * Handles rendering the document and updating the DOM
 */

import { BASE_PATH } from '../core/config.js?v=41000';
import { createTagTicker } from '../tag-ticker.js?v=41000';
import { stopScrollHighlight } from '../toc.js?v=41000';
import { cleanupScrollAnimations, cleanupDashboardAnimations } from '../animations.js?v=41000';

/**
 * Updates the DOM with the processed document
 */
export function renderDocumentView(title, tags, html, metadata) {
    const tickerHtml = createTagTicker(tags);

    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
      <div class="document-container markdown">
        <div class="document-title" style="view-transition-name: active-note-expand">${title}</div>
        ${tickerHtml}
        ${html}
      </div>
    `;

    // Update Head Tags
    if (metadata) {
        document.title = `${metadata.title} - SharePage`;
        updateHeadMetadata(metadata);
    }
}

/**
 * Updates SEO meta tags in the document head
 */
function updateHeadMetadata(metadata) {
    const setMeta = (name, content, property = false) => {
        if (!content) return;

        const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
        let element = document.querySelector(selector);

        if (!element) {
            element = document.createElement('meta');
            if (property) element.setAttribute('property', name);
            else element.setAttribute('name', name);
            document.head.appendChild(element);
        }

        element.setAttribute('content', content);
    };

    setMeta('description', metadata.description);
    setMeta('og:title', metadata.title, true);
    setMeta('og:description', metadata.description, true);
    setMeta('og:url', metadata.url, true);
    if (metadata.thumbnail) {
        setMeta('og:image', metadata.thumbnail, true);
    }
}

/**
 * Updates layout state (classes, TOC visibility)
 */
export function prepareLayout({ isDashboard }) {
    stopScrollHighlight();
    cleanupScrollAnimations();
    cleanupDashboardAnimations();

    const tocSidebar = document.getElementById('toc-sidebar');
    const tocContainer = document.getElementById('toc-content');
    const mainLayout = document.querySelector('.main-layout');

    // Reset TOC
    if (tocSidebar) tocSidebar.classList.remove('visible');
    if (tocContainer) tocContainer.innerHTML = '';

    // Update Main Layout Class
    if (mainLayout) {
        if (isDashboard) {
            mainLayout.classList.add('is-dashboard');
        } else {
            mainLayout.classList.remove('is-dashboard');
        }
    }
}

/**
 * Renders the error page
 */
export function renderError(resourceName, error) {
    console.error(`[View] Error loading ${resourceName}: `, error);
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
    <div class="error-container">
      <h1>404 Not Found</h1>
      <p>The document "<strong>${resourceName}</strong>" could not be loaded.</p>
      <br/>
      <p class="error-detail">${error.message}</p>
      <a href="${BASE_PATH || '/'}" class="back-button">Go to Dashboard</a>
    </div>
    `;
}

/**
 * Shows a loading state
 */
export function renderLoading(text = 'Loading Content') {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
    <div class="loading-container">
      <div class="spinner"></div>
      <div class="loading-text">${text}</div>
    </div>
  `;
}
