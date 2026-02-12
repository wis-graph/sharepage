import { fetchFile, transformObsidianImageLinks, transformInternalLinks, parseFrontmatter } from './utils.js';
import { createTagTicker } from './tag-ticker.js';
import { applySyntaxHighlighting, renderMermaidDiagrams, protectMath, restoreMath, normalizeMermaidAliases } from './renderer.js';
import { loadDashboardNotes, renderDashboardPage } from './dashboard.js';
import { addHeadingIds, renderTOC, initScrollHighlight, stopScrollHighlight } from './toc.js';
import { initImageViewer } from './image-viewer.js';
import { initCodeUtils } from './code-utils.js';

/**
 * Main navigation entry point
 * @param {string} hash - The URL hash (e.g. #/My-Note)
 */
export async function navigate(hash) {
  if (hash === '/' || hash === '') {
    await handleDashboardRoute();
  } else {
    const filename = decodeURIComponent(hash.slice(1));
    await handleDocumentRoute(filename);
  }
}

/**
 * Handles the dashboard route logic
 */
async function handleDashboardRoute() {
  prepareLayout({ isDashboard: true });

  // Set Loading State
  document.getElementById('app').innerHTML = '<div class="loading-container"><div class="spinner"></div><div class="loading-text">Loading Dashboard</div></div>';
  document.title = 'Dashboard - ShareHub';
  console.log('[Router] Loading dashboard');

  try {
    await loadDashboardNotes();
    const html = await renderDashboardPage(1);
    document.getElementById('app').innerHTML = html;
    window.scrollTo(0, 0);
  } catch (error) {
    renderError('Dashboard', error);
  }
}

/**
 * Handles individual document route logic
 * @param {string} filename 
 */
async function handleDocumentRoute(filename) {
  prepareLayout({ isDashboard: false });

  // Set Loading State
  document.getElementById('app').innerHTML = '<div class="loading-container"><div class="spinner"></div><div class="loading-text">Loading Content</div></div>';
  document.title = `${filename} - ShareHub`;
  console.log('[Router] Dynamic navigation to:', filename);

  try {
    const rawContent = await fetchFile(filename);

    // Process content (Refactored pipeline)
    const { html, tags, title } = await processDocument(filename, rawContent);

    // Render View
    renderDocumentView(title, tags, html);

    // key post-render initializations
    initPostRenderScripts();

  } catch (error) {
    renderError(filename, error);
  }
}

/**
 * Updates layout state (classes, TOC visibility)
 */
function prepareLayout({ isDashboard }) {
  stopScrollHighlight();

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
 * Core processing pipeline: Markdown -> HTML
 */
async function processDocument(filename, rawContent) {
  console.log('[Render] Original markdown length:', rawContent.length);

  // 1. Parse Frontmatter
  let { data, content } = parseFrontmatter(rawContent);
  console.log('[Render] Content after frontmatter:', content.length);

  // 1.5. Normalize Mermaid Aliases
  content = normalizeMermaidAliases(content);

  // 2. Transform Images
  content = transformObsidianImageLinks(content);

  // 3. Protect Math
  content = protectMath(content);

  // 4. Parse Markdown into HTML
  let html = marked.parse(content);

  // 5. Post-processing HTML
  html = addHeadingIds(html);
  html = applySyntaxHighlighting(html);
  html = renderMermaidDiagrams(html);
  html = restoreMath(html);
  html = transformInternalLinks(html);

  return {
    html: html,
    tags: data.tags || [],
    title: filename.replace(/\.md$/, '')
  };
}

/**
 * Updates the DOM with the processed document
 */
function renderDocumentView(title, tags, html) {
  const tickerHtml = createTagTicker(tags);

  document.getElementById('app').innerHTML = `
      <div class="document-container markdown">
        <div class="document-title">${title}</div>
        ${tickerHtml}
        ${html}
      </div>
    `;
}

/**
 * Initializes utilities that need the DOM to be ready
 */
async function initPostRenderScripts() {
  initImageViewer();
  initCodeUtils();

  // Initialize Mermaid
  const mermaidElements = document.querySelectorAll('.mermaid');
  if (mermaidElements.length > 0) {
    try {
      await mermaid.run({ querySelector: '.mermaid' });
      console.log('[Router] Mermaid rendered');
    } catch (e) {
      console.warn('[Router] Mermaid error:', e);
    }
  }

  // Initialize TOC
  renderTOC();
  initScrollHighlight();

  console.log('[Router] Content fully rendered');
}

/**
 * Renders the error page
 */
function renderError(resourceName, error) {
  console.error(`[Router] Error loading ${resourceName}:`, error);
  document.getElementById('app').innerHTML = `
    <div class="error-container">
      <h1>404 Not Found</h1>
      <p>The document "<strong>${resourceName}</strong>" could not be loaded.</p>
      <br/>
      <p class="error-detail">${error.message}</p>
      <a href="#/" class="back-button">Go to Dashboard</a>
    </div>
  `;
}
