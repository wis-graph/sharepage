export function applySyntaxHighlighting(html) {
  console.log('[Highlight] Applying syntax highlighting');
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const codeBlocks = doc.querySelectorAll('pre code');
  console.log('[Highlight] Found', codeBlocks.length, 'code blocks');

  codeBlocks.forEach((block) => {
    const code = block.textContent;
    const language = block.className.match(/language-(\w+)/)?.[1];

    if (language && hljs.getLanguage(language)) {
      const result = hljs.highlight(code, { language: language, ignoreIllegals: true });
      block.innerHTML = result.value;
      block.className = `hljs language-${language}`;
    } else {
      const result = hljs.highlightAuto(code);
      block.innerHTML = result.value;
      block.className = 'hljs';
    }
  });

  console.log('[Highlight] Syntax highlighting applied');
  return doc.body.innerHTML;
}

export function renderMermaidDiagrams(html) {
  console.log('[Mermaid] Rendering diagrams');
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const mermaidBlocks = doc.querySelectorAll('pre code.language-mermaid, code.language-mermaid');
  console.log('[Mermaid] Found', mermaidBlocks.length, 'mermaid blocks');

  mermaidBlocks.forEach((block) => {
    const code = block.textContent.trim();
    const wrapper = document.createElement('div');
    wrapper.className = 'mermaid';
    wrapper.textContent = code;
    block.parentElement.replaceWith(wrapper);
  });

  return doc.body.innerHTML;
}

export function renderMath(html) {
  console.log('[Math] Rendering math expressions');

  html = html.replace(/\$\$([\s\S]*?)\$\$/g, (match, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: true });
    } catch (e) {
      console.error('[Math] Error rendering display math:', e);
      return match;
    }
  });

  html = html.replace(/\$([^$\n]+?)\$/g, (match, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false });
    } catch (e) {
      console.error('[Math] Error rendering inline math:', e);
      return match;
    }
  });

  return html;
}
