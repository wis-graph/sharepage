import { fetchFile, transformObsidianImageLinks, transformInternalLinks, parseFrontmatter, getRawUrl } from './utils.js?v=4400';
import { createTagTicker } from './tag-ticker.js?v=4400';
import { applySyntaxHighlighting, renderMermaidDiagrams, protectMath, restoreMath, normalizeMermaidAliases, transformYouTubeLinks } from './renderer.js?v=4400';
import { loadDashboardNotes, renderDashboardPage } from './dashboard.js?v=4400';
import { addHeadingIds, renderTOC, initScrollHighlight, stopScrollHighlight } from './toc.js?v=4400';
import { initImageViewer } from './image-viewer.js?v=4400';
import { initCodeUtils } from './code-utils.js?v=4400';

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
  document.title = 'Dashboard - SharePage';
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

  // 2.5. Transform YouTube Links
  content = transformYouTubeLinks(content);

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
        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=4400)|youtu\.be\/)([^"&?\/\s]{11})/;
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
        <div class="document-title">${title}</div>
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
  console.error(`[Router] Error loading ${resourceName}: `, error);
  document.getElementById('app').innerHTML = `
    < div class="error-container" >
      <h1>404 Not Found</h1>
      <p>The document "<strong>${resourceName}</strong>" could not be loaded.</p>
      <br/>
      <p class="error-detail">${error.message}</p>
      <a href="#/" class="back-button">Go to Dashboard</a>
    </div >
    `;
}
