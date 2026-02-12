import { fetchFile, transformObsidianImageLinks, transformInternalLinks, routes, parseFrontmatter } from './utils.js';
import { createTagTicker } from './tag-ticker.js';
import { applySyntaxHighlighting, renderMermaidDiagrams, protectMath, restoreMath } from './renderer.js';
import { loadDashboardNotes, renderDashboardPage } from './dashboard.js';
import { addHeadingIds, renderTOC, initScrollHighlight, stopScrollHighlight } from './toc.js';
import { initImageViewer } from './image-viewer.js';
import { initCodeUtils } from './code-utils.js';

export async function navigate(hash) {
  if (hash === '/') {
    stopScrollHighlight();

    const tocSidebar = document.getElementById('toc-sidebar');
    const tocContainer = document.getElementById('toc-content');
    if (tocSidebar) {
      tocSidebar.classList.remove('visible');
    }
    if (tocContainer) {
      tocContainer.innerHTML = '';
    }

    const mainLayout = document.querySelector('.main-layout');
    if (mainLayout) mainLayout.classList.add('is-dashboard');

    document.getElementById('app').innerHTML = '<div class="loading-container"><div class="spinner"></div><div class="loading-text">Loading Dashboard</div></div>';
    document.title = 'Dashboard - ShareHub';

    console.log('[Router] Loading dashboard');

    await loadDashboardNotes();

    const html = renderDashboardPage(1);
    document.getElementById('app').innerHTML = html;
    window.scrollTo(0, 0);
  } else {
    const route = routes[hash];

    if (route) {
      const mainLayout = document.querySelector('.main-layout');
      if (mainLayout) mainLayout.classList.remove('is-dashboard');

      document.getElementById('app').innerHTML = '<div class="loading-container"><div class="spinner"></div><div class="loading-text">Loading Content</div></div>';
      document.title = route.title + ' - ShareHub';

      console.log('[Router] Navigating to:', hash);

      try {
        let content = await fetchFile(route.file);
        console.log('[Render] Original markdown length:', content.length);

        const { data, content: bodyContent } = parseFrontmatter(content);
        content = bodyContent;
        console.log('[Render] Markdown after parsing frontmatter length:', content.length);

        const tickerHtml = createTagTicker(data.tags);

        content = transformObsidianImageLinks(content);
        console.log('[Render] Markdown after image conversion length:', content.length);

        // Protect math BEFORE marked.parse
        content = protectMath(content);

        console.log('[Render] Parsing markdown with marked.js');
        let html = marked.parse(content);

        html = addHeadingIds(html);
        html = applySyntaxHighlighting(html);
        html = renderMermaidDiagrams(html);

        // Restore math AFTER marked.parse
        html = restoreMath(html);

        html = transformInternalLinks(html);

        document.getElementById('app').innerHTML = `
          <div class="document-container markdown">
            ${tickerHtml}
            ${html}
          </div>
        `;
        initImageViewer();
        initCodeUtils();

        const mermaidElements = document.querySelectorAll('.mermaid');
        console.log('[Router] Found mermaid elements:', mermaidElements.length);

        if (mermaidElements.length > 0) {
          await mermaid.run({
            querySelector: '.mermaid'
          });
          console.log('[Router] Mermaid rendering complete');
        }

        renderTOC();
        initScrollHighlight();

        console.log('[Router] Content rendered');
      } catch (error) {
        console.error('[Router] Error:', error);
        document.getElementById('app').innerHTML = '<div class="error">Error: ' + error.message + '</div>';
      }
    } else {
      console.log('[Router] Route not found:', hash);
      document.getElementById('app').innerHTML = '<h1>404 Not Found</h1><p>The route "' + hash + '" does not exist.</p>';
    }
  }
}
