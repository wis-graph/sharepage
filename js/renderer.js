const mathMap = new Map();
let mathCounter = 0;

export function protectMath(markdown) {
  mathMap.clear();
  mathCounter = 0;

  // Protect Display Math $$ ... $$
  markdown = markdown.replace(/\$\$([\s\S]*?)\$\$/g, (match, math) => {
    const placeholder = `@@MATH_BLOCK_${mathCounter}@@`;
    mathMap.set(placeholder, { math: math.trim(), displayMode: true });
    mathCounter++;
    return placeholder;
  });

  // Protect Inline Math $ ... $
  // Note: Obsidian/Commonmark inline math should not have space after opening $ or before closing $
  // But for better compatibility, we use a slightly more relaxed regex but avoiding escaping \$
  markdown = markdown.replace(/(?<!\\)\$([^$\n]+?)(?<!\\)\$/g, (match, math) => {
    const placeholder = `@@MATH_INLINE_${mathCounter}@@`;
    mathMap.set(placeholder, { math: math.trim(), displayMode: false });
    mathCounter++;
    return placeholder;
  });

  return markdown;
}

export function restoreMath(html) {
  for (const [placeholder, data] of mathMap.entries()) {
    try {
      const rendered = katex.renderToString(data.math, { 
        displayMode: data.displayMode,
        throwOnError: false 
      });
      // Important: Use replaceAll if supported or a global regex
      html = html.split(placeholder).join(rendered);
    } catch (e) {
      console.error('[Math] Error rendering math:', e);
      html = html.split(placeholder).join(data.math);
    }
  }
  return html;
}

export function applySyntaxHighlighting(html) {
  console.log('[Highlight] Applying syntax highlighting');
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const codeBlocks = doc.querySelectorAll('pre code');
  
  codeBlocks.forEach((block) => {
    const code = block.textContent;
    const language = block.className.match(/language-(\w+)/)?.[1];

    if (language === 'mermaid') return; // Skip mermaid, handled separately

    if (language && typeof hljs !== 'undefined' && hljs.getLanguage(language)) {
      const result = hljs.highlight(code, { language: language, ignoreIllegals: true });
      block.innerHTML = result.value;
      block.className = `hljs language-${language}`;
    } else if (typeof hljs !== 'undefined') {
      const result = hljs.highlightAuto(code);
      block.innerHTML = result.value;
      block.className = 'hljs';
    }
  });

  return doc.body.innerHTML;
}

export function renderMermaidDiagrams(html) {
  console.log('[Mermaid] Preparing diagrams');
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Obsidian style often results in language-mermaid
  const mermaidBlocks = doc.querySelectorAll('pre code.language-mermaid, code.language-mermaid');

  mermaidBlocks.forEach((block) => {
    const code = block.textContent.trim();
    const container = document.createElement('div');
    container.className = 'mermaid';
    container.textContent = code;
    
    // Replace the whole pre or code block
    const target = block.tagName.toLowerCase() === 'code' && block.parentElement.tagName.toLowerCase() === 'pre' 
      ? block.parentElement 
      : block;
    target.replaceWith(container);
  });

  return doc.body.innerHTML;
}

// Keep renderMath for legacy if needed, but we prefer protect/restore
export function renderMath(html) {
  return restoreMath(html);
}
