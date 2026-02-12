import { fetchFile, transformObsidianImageLinks, transformInternalLinks, parseFrontmatter, getRawUrl, BASE_PATH, IS_LOCAL } from './utils.js?v=32001';
import { createTagTicker } from './tag-ticker.js?v=32001';
import { applySyntaxHighlighting, renderMermaidDiagrams, protectMath, restoreMath, normalizeMermaidAliases, transformYouTubeLinks } from './renderer.js?v=32001';
import { loadDashboardNotes, renderDashboardPage } from './dashboard.js?v=32001';
import { addHeadingIds, renderTOC, initScrollHighlight, stopScrollHighlight } from './toc.js?v=32001';
import { initImageViewer } from './image-viewer.js?v=32001';
import { initCodeUtils } from './code-utils.js?v=32001';
import { initLinkPreviews } from './preview.js?v=32001';
import { transformCallouts } from './callouts.js?v=32001';
import { initScrollAnimations, cleanupScrollAnimations, initDashboardAnimations, cleanupDashboardAnimations } from './animations.js?v=32001';

/**
 * Main navigation entry point
 * @param {string} rawPath - The URL path (e.g. /sharepage/My-Note)
 */
export async function navigate(rawPath) {
  console.log('[Router] Navigating to:', rawPath, '(Base:', BASE_PATH, ')');

  // Normalize path by removing BASE_PATH if present
  let path = rawPath;
  if (BASE_PATH && path.startsWith(BASE_PATH)) {
    path = path.slice(BASE_PATH.length);
  }

  // Ensure path starts with /
  if (!path.startsWith('/')) path = '/' + path;

  // Strip trailing slashes for consistency
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }

  let normalizedPath = path;
  if (normalizedPath.endsWith('.html')) {
    normalizedPath = normalizedPath.slice(0, -5);
  }

  if (normalizedPath === '' || normalizedPath === '/') {
    await handleDashboardRoute();
  } else {
    // Strip leading slash to get filename
    const filename = decodeURIComponent(normalizedPath.slice(1));
    await handleDocumentRoute(filename);
  }
}

/**
 * Global click interceptor for internal links
 */
export function initRouter() {
  document.body.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;

    // Handle internal path links (starting with / or same origin)
    if (href.startsWith('/') || href.startsWith(window.location.origin)) {
      const url = new URL(href, window.location.origin);

      // Don't intercept if it's an external link or has a different origin
      if (url.origin !== window.location.origin) return;

      e.preventDefault();

      let path = url.pathname;

      // Ensure path includes BASE_PATH if we are navigating internally
      if (BASE_PATH && !path.startsWith(BASE_PATH)) {
        path = BASE_PATH + (path.startsWith('/') ? '' : '/') + path;
      }

      if (window.location.pathname === path) return;

      history.pushState(null, '', path);

      if (document.startViewTransition) {
        document.startViewTransition(() => navigate(path));
      } else {
        navigate(path);
      }
    }
    // Handle old hash links for backward compatibility
    else if (href.startsWith('#/')) {
      e.preventDefault();
      const path = href.slice(1); // /MyNote
      history.pushState(null, '', path);
      navigate(path);
    }
  });

  window.addEventListener('popstate', () => {
    navigate(window.location.pathname);
  });
}

/**
 * Handles the dashboard route logic
 */
async function handleDashboardRoute() {
  prepareLayout({ isDashboard: true });

  // Set Loading State
  document.getElementById('app').innerHTML = '<div class="loading-container"><div class="spinner"></div><div class="loading-text">Loading Dashboard</div></div>';
  document.title = 'Dashboard - SharePage';
  console.log('[Router] Loading dashboard');

  try {
    await loadDashboardNotes();
    const html = await renderDashboardPage(1);
    document.getElementById('app').innerHTML = html;
    window.scrollTo(0, 0);

    // Initialize dashboard card animations
    initDashboardAnimations();
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
  document.title = `${filename} - SharePage`;
  console.log('[Router] Dynamic navigation to:', filename);

  try {
    const rawContent = await fetchFile(filename);

    // Process content (Refactored pipeline)
    // Process content (Refactored pipeline)
    const { html, tags, title, metadata } = await processDocument(filename, rawContent);

    // Render View
    renderDocumentView(title, tags, html, metadata);

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
 * Core processing pipeline: Markdown -> HTML
 */
async function processDocument(filename, rawContent) {
  console.log('[Render] Original markdown length:', rawContent.length);

  // 1. Parse Frontmatter
  let { data, content } = parseFrontmatter(rawContent);
  console.log('[Render] Content after frontmatter:', content.length);

  // 1.5. Normalize Mermaid Aliases
  content = normalizeMermaidAliases(content);

  // 1.6. Transform Callouts (before markdown parsing)
  content = transformCallouts(content);

  // 2. Transform Images
  content = transformObsidianImageLinks(content);

  // 2.1. Transform Internal Links
  content = transformInternalLinks(content);

  // 2.5. Transform YouTube Links
  content = transformYouTubeLinks(content);

  // 3. Protect Math
  content = protectMath(content);

  // 4. Parse Markdown into HTML
  // Set options for better Obsidian/GFM compatibility
  marked.use({
    gfm: true,
    breaks: true,
    mangle: false,
    headerIds: false
  });

  // Pre-process for CJK Bold boundaries (Standard CommonMark fails on **bold**word)
  // We manually convert **bold** and __bold__ to <strong> tags to bypass marked.js strictness
  content = content.replace(/(\*\*|__)(?=\S)([\s\S]+?)(?<=\S)\1/g, (match, p1, p2) => {
    // Avoid nested delimiters for simplicity in this pre-pass
    if (p2.includes(p1)) return match;
    return `<strong>${p2}</strong>`;
  });

  let html = marked.parse(content);

  // 5. Post-processing HTML
  html = addHeadingIds(html);
  html = applySyntaxHighlighting(html);
  html = renderMermaidDiagrams(html);
  html = restoreMath(html);
  html = transformInternalLinks(html);

  // Extract Metadata for Head Tags
  let description = data.description || data.summary || data.excerpt || '';
  if (!description) {
    // Extract first paragraph as description form raw content, removing markdown syntax
    const plainText = content.replace(/[#*`_\[\]]/g, '').trim();
    description = plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');
  }

  let thumbnail = data.thumbnail ? getRawUrl('_image_' + data.thumbnail) : null;
  if (!thumbnail) {
    // Try to find first image or YouTube video
    // Use rawContent to find syntax, but be careful of transformed links.
    // Actually, 'content' variable has been transformed by normalizeMermaid, transformObsidianImage, transformYouTube.
    // transformObsidianImageLinks converts ![[...]] to standard markdown images.
    // transformYouTubeLinks converts markdown video links to iframes.

    // So 'content' at this point might not have original ![[...]] or ![...](yt).
    // Let's use 'rawContent' for metadata extraction to be safe, as it preserves original syntax.

    const obsidianMatch = rawContent.match(/!\[\[([^\]]+)\]\]/);
    let obsidianIndex = obsidianMatch ? obsidianMatch.index : Infinity;

    const markdownMatch = rawContent.match(/!\[([^\]]*)\]\(([^)]+)\)/);
    let markdownIndex = markdownMatch ? markdownMatch.index : Infinity;

    if (obsidianMatch || markdownMatch) {
      if (obsidianIndex < markdownIndex) {
        // Obsidian image found first
        thumbnail = getRawUrl('_image_' + obsidianMatch[1]);
      } else if (markdownMatch) {
        // Markdown image found first
        const url = markdownMatch[2];
        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const ytMatch = url.match(youtubeRegex);

        if (ytMatch && ytMatch[1]) {
          thumbnail = `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
        } else {
          thumbnail = url;
        }
      }
    }
  }

  return {
    html: html,
    tags: data.tags || [],
    title: filename.replace(/\.md$/, ''),
    metadata: {
      title: data.title || filename.replace(/\.md$/, ''),
      description: description,
      thumbnail: thumbnail,
      url: window.location.href
    }
  };
}

/**
 * Updates the DOM with the processed document
 */
function renderDocumentView(title, tags, html, metadata) {
  const tickerHtml = createTagTicker(tags);

  document.getElementById('app').innerHTML = `
      <div class="document-container markdown">
        <div class="document-title" style="view-transition-name: active-note-expand">${title}</div>
        ${tickerHtml}
        ${html}
      </div>
    `;

  // Update Head Tags
  if (metadata) {
    document.title = `${metadata.title} - SharePage`;

    // Helper to set meta tag
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
}

/**
 * Initializes utilities that need the DOM to be ready
 */
async function initPostRenderScripts() {
  initImageViewer();
  initCodeUtils();
  initLinkPreviews();

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

  // Initialize scroll animations
  initScrollAnimations();

  console.log('[Router] Content fully rendered');
}

/**
 * Renders the error page
 */
function renderError(resourceName, error) {
  console.error(`[Router] Error loading ${resourceName}: `, error);
  document.getElementById('app').innerHTML = `
    <div class="error-container">
      <h1>404 Not Found</h1>
      <p>The document "<strong>${resourceName}</strong>" could not be loaded.</p>
      <br/>
      <p class="error-detail">${error.message}</p>
      <a href="${BASE_PATH || '/'}" class="back-button">Go to Dashboard</a>
    </div>
    `;
}
