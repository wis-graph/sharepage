import { fetchFile, convertImageLinks, convertInternalLinks, routes } from './utils.js';
import { applySyntaxHighlighting, renderMermaidDiagrams, renderMath } from './renderer.js';
import { loadDashboardNotes, renderDashboardPage } from './dashboard.js';

function removeFrontmatter(markdown) {
  return markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
}

export async function navigate(hash) {
  if (hash === '/') {
    document.getElementById('app').innerHTML = '<div class="loading">Loading dashboard...</div>';
    document.title = 'Dashboard - ShareHub';

    console.log('[Router] Loading dashboard');

    await loadDashboardNotes();

    const html = renderDashboardPage(1);
    document.getElementById('app').innerHTML = html;
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

        content = convertImageLinks(content);
        console.log('[Render] Markdown after image conversion length:', content.length);

        console.log('[Render] Parsing markdown with marked.js');
        let html = marked.parse(content);

        html = applySyntaxHighlighting(html);
        html = renderMermaidDiagrams(html);
        html = renderMath(html);
        html = convertInternalLinks(html);

        document.getElementById('app').innerHTML = `<div class="document-container markdown">${html}</div>`;

        await mermaid.run({
          nodes: document.querySelectorAll('.mermaid')
        });

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
