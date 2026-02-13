/**
 * Render Service
 * Handles transformations on Markdown and processed HTML (Math, Highlighting, Mermaid)
 */

const mathMap = new Map();
let mathCounter = 0;

/**
 * Normalize merlight, merdark, mer to mermaid
 */
export function normalizeMermaidAliases(markdown) {
    return markdown.replace(/```(merlight|merdark|mer)/g, '```mermaid');
}

/**
 * Protect Math formulas from markdown parsing
 */
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
    markdown = markdown.replace(/(?<!\\)\$([^$\n]+?)(?<!\\)\$/g, (match, math) => {
        const placeholder = `@@MATH_INLINE_${mathCounter}@@`;
        mathMap.set(placeholder, { math: math.trim(), displayMode: false });
        mathCounter++;
        return placeholder;
    });

    return markdown;
}

/**
 * Restore Math formulas with KaTeX rendering
 */
export function restoreMath(html) {
    for (const [placeholder, data] of mathMap.entries()) {
        try {
            if (typeof katex !== 'undefined') {
                const rendered = katex.renderToString(data.math, {
                    displayMode: data.displayMode,
                    throwOnError: false
                });
                html = html.split(placeholder).join(rendered);
            } else {
                html = html.split(placeholder).join(data.math);
            }
        } catch (e) {
            console.error('[Math] Error rendering math:', e);
            html = html.split(placeholder).join(data.math);
        }
    }
    return html;
}

/**
 * Apply Highlight.js syntax highlighting
 */
export function applySyntaxHighlighting(html) {
    if (typeof hljs === 'undefined') return html;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const codeBlocks = doc.querySelectorAll('pre code');

    codeBlocks.forEach((block) => {
        const code = block.textContent;
        const language = block.className.match(/language-(\w+)/)?.[1];

        if (language === 'mermaid') return;

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

    return doc.body.innerHTML;
}

/**
 * Transform Mermaid code blocks into containers for Mermaid.js
 */
export function renderMermaidDiagrams(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const allCodeBlocks = doc.querySelectorAll('pre code');

    const mermaidKeywords = [
        'graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram',
        'stateDiagram-v2', 'erDiagram', 'gantt', 'pie', 'journey', 'gitGraph',
        'mindmap', 'timeline', 'quadrantChart', 'requirementDiagram', 'c4Context'
    ];

    allCodeBlocks.forEach((block) => {
        const code = block.textContent.trim();
        const isMermaidClass = block.classList.contains('language-mermaid') ||
            (block.className && block.className.includes('mermaid'));

        const firstWord = code.split(/\s+/)[0];
        const isMermaidContent = mermaidKeywords.includes(firstWord);

        if (isMermaidClass || isMermaidContent) {
            let finalCode = code;
            let width = null;
            let height = null;

            const lines = finalCode.split('\n');
            if (lines.length > 0) {
                const firstLine = lines[0].trim();
                const dimMatch = firstLine.match(/^(\d+)?(?:,(\d+))?$/);

                if (dimMatch && (dimMatch[1] || dimMatch[2])) {
                    if (dimMatch[1]) width = dimMatch[1];
                    if (dimMatch[2]) height = dimMatch[2];
                    finalCode = lines.slice(1).join('\n').trim();
                }
            }

            const container = document.createElement('div');
            container.className = 'mermaid';
            if (width) container.style.width = width + 'px';
            if (height) container.style.height = height + 'px';

            if (width || height) {
                container.style.maxWidth = '100%';
                container.style.marginLeft = 'auto';
                container.style.marginRight = 'auto';
            }

            container.setAttribute('data-code', finalCode);
            container.textContent = finalCode;

            const target = (block.parentElement && block.parentElement.tagName.toLowerCase() === 'pre')
                ? block.parentElement
                : block;

            target.replaceWith(container);
        }
    });

    return doc.body.innerHTML;
}

/**
 * Transform YouTube links (markdown images) to iframes
 */
export function transformYouTubeLinks(markdown) {
    const imageLinkRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;

    return markdown.replace(imageLinkRegex, (match, alt, url) => {
        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const ytMatch = url.match(youtubeRegex);

        if (ytMatch && ytMatch[1]) {
            const videoId = ytMatch[1];
            return `
<div class="video-container">
  <iframe 
    src="https://www.youtube.com/embed/${videoId}" 
    title="${alt || 'YouTube video player'}" 
    frameborder="0" 
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
    referrerpolicy="strict-origin-when-cross-origin" 
    allowfullscreen>
  </iframe>
</div>`;
        }

        return match;
    });
}
