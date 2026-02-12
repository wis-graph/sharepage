const mathMap = new Map();
let mathCounter = 0;

export function normalizeMermaidAliases(markdown) {
  // Normalize merlight, merdark, mer to mermaid
  // We don't remove the dimension line here; we'll handle it in the renderer
  // to ensure we have access to the DOM element for styling.
  return markdown.replace(/```(merlight|merdark|mer)/g, '```mermaid');
}

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
    let code = block.textContent.trim();
    let width = null;
    let height = null;

    // Check for dimension format in the first line:
    // "300" -> width: 300px
    // ",300" -> height: 300px
    // "300,200" -> width: 300px, height: 200px
    const lines = code.split('\n');
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      const dimMatch = firstLine.match(/^(\d+)?(?:,(\d+))?$/);

      if (dimMatch && (dimMatch[1] || dimMatch[2])) {
        // It's a dimension line!
        if (dimMatch[1]) width = dimMatch[1];
        if (dimMatch[2]) height = dimMatch[2];

        // Remove the dimension line from the code
        code = lines.slice(1).join('\n').trim();
      }
    }

    const container = document.createElement('div');
    container.className = 'mermaid';

    // Apply dimensions if found
    if (width) container.style.width = width + 'px';
    if (height) container.style.height = height + 'px';

    // Preserve aspect ratio if only one dimension is set, or center it
    if (width || height) {
      container.style.maxWidth = '100%';
      container.style.marginLeft = 'auto';
      container.style.marginRight = 'auto';
    }

    container.setAttribute('data-code', code); // Store original code for copy function
    container.textContent = code;

    // Replace the whole pre or code block
    // If inside a <pre>, replace the parent <pre>. Otherwise just the <code>.
    const target = (block.parentElement && block.parentElement.tagName.toLowerCase() === 'pre')
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
