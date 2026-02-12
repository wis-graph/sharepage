import { fetchFile, transformObsidianImageLinks, transformInternalLinks, routes } from './utils.js';
import { applySyntaxHighlighting, renderMermaidDiagrams, renderMath } from './renderer.js';
import { loadDashboardNotes, renderDashboardPage } from './dashboard.js';
import { addHeadingIds, renderTOC, initScrollHighlight, stopScrollHighlight } from './toc.js';

function removeFrontmatter(markdown) {
  return markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
}

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

    document.getElementById('app').innerHTML = '<div class="loading">Loading dashboard...</div>';
    document.title = 'Dashboard - ShareHub';

    console.log('[Router] Loading dashboard');

    await loadDashboardNotes();

    const html = renderDashboardPage(1);
    document.getElementById('app').innerHTML = html;
    window.scrollTo(0, 0);
  } else {
    const route = routes[hash];

    if (route) {
      document.getElementById('app').innerHTML = '<div class="loading">Loading...</div>';
      document.title = route.title + ' - ShareHub';

      console.log('[Router] Navigating to:', hash);

      try {
        let content = await fetchFile(route.file);
        console.log('[Render] Original markdown length:', content.length);

        content = removeFrontmatter(content);
        console.log('[Render] Markdown after removing frontmatter length:', content.length);

        content = transformObsidianImageLinks(content);
        console.log('[Render] Markdown after image conversion length:', content.length);

        console.log('[Render] Parsing markdown with marked.js');
        let html = marked.parse(content);

        html = addHeadingIds(html);
        html = applySyntaxHighlighting(html);
        html = renderMermaidDiagrams(html);
        html = renderMath(html);
        html = transformInternalLinks(html);

        document.getElementById('app').innerHTML = `<div class="document-container markdown">${html}</div>`;

        await mermaid.run({
          nodes: document.querySelectorAll('.mermaid')
        });

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
