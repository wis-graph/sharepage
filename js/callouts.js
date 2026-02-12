
const ICONS = {
    note: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>',
    abstract: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clipboard-list"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>',
    info: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
    tip: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-flame"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.1.243-2.143.5-3.5 2.558 2.378 2.63 3.655 2.5 4.5Z"/></svg>',
    success: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg>',
    question: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-help-circle"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>',
    warning: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
    failure: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    danger: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-zap"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    bug: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bug"><path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/></svg>',
    example: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>',
    quote: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-quote"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1Z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1Z"/></svg>'
};

const CALLOUT_TYPES = {
    note: 'note',
    seealso: 'note',
    abstract: 'abstract',
    summary: 'abstract',
    tldr: 'abstract',
    info: 'info',
    todo: 'info',
    tip: 'tip',
    hint: 'tip',
    important: 'tip',
    success: 'success',
    check: 'success',
    done: 'success',
    question: 'question',
    help: 'question',
    faq: 'question',
    warning: 'warning',
    caution: 'warning',
    attention: 'warning',
    failure: 'failure',
    fail: 'failure',
    missing: 'failure',
    danger: 'danger',
    error: 'danger',
    bug: 'bug',
    example: 'example',
    quote: 'quote',
    cite: 'quote'
};

export function transformCallouts(markdown) {
    // Regex to match blockquotes with callout syntax
    // > [!type] Title
    // > Content

    // We need to capture the full block. 
    // Markdown blockquotes are lines starting with >, possibly with content.
    // We'll iterate through lines to find callout blocks.

    const lines = markdown.split('\n');
    const output = [];
    let insideCallout = false;
    let currentCallout = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(/^>\s*\[!(\w+)\](.*)/);

        if (match) {
            // Start of a new callout
            if (insideCallout) {
                // Close previous callout
                output.push(renderCallout(currentCallout));
            }

            const type = match[1].toLowerCase();
            const title = match[2].trim() || type.charAt(0).toUpperCase() + type.slice(1);

            insideCallout = true;
            currentCallout = {
                type: CALLOUT_TYPES[type] || 'note',
                title: title,
                content: []
            };
        } else if (insideCallout && line.startsWith('>')) {
            // Continuation of callout
            // Remove the '>' and optional space
            let contentLine = line.replace(/^>\s?/, '');
            currentCallout.content.push(contentLine);
        } else if (insideCallout && line.trim() === '') {
            // Empty line inside callout (usually still has > but sometimes markdown parsers are lenient)
            // Check if next line is also part of blockquote or if it allows lazy continuation (which we probably shouldn't support to keep it simple)
            // For now, if it's purely empty and next line doesn't start with >, we assume end of blockquote.
            // But standard markdown allows lazy continuation. 
            // To be safe and strict like Obsidian usually is: breaks on non-quoted lines (unless lazy)

            // Let's assume strict blockquotes for simplicity: must start with >
            // But allow empty lines if they are just empty strings in the array (handled by join)
            // If the line is empty string in split, it means it was a blank line in text.

            // If we see a blank line, standard markdown ends the blockquote? No, standard markdown requires blank line to separate blocks?
            // Actually, in many implementations, a blank line breaks the blockquote unless subsequent lines have >.
            // Let's check the next line.

            const nextLine = lines[i + 1];
            if (nextLine && nextLine.startsWith('>')) {
                currentCallout.content.push('');
            } else {
                output.push(renderCallout(currentCallout));
                insideCallout = false;
                currentCallout = null;
                output.push(line);
            }
        } else {
            // Not a callout line
            if (insideCallout) {
                output.push(renderCallout(currentCallout));
                insideCallout = false;
                currentCallout = null;
            }
            output.push(line);
        }
    }

    if (insideCallout) {
        output.push(renderCallout(currentCallout));
    }

    return output.join('\n');
}

function renderCallout(callout) {
    const icon = ICONS[callout.type] || ICONS['note'];
    // We need to parse the content with marked later?
    // The content inside callout is markdown.
    // We should wrap it in a div that will be marked later?
    // No, marked parses the whole string.
    // If we insert HTML tags, marked will treat them as raw HTML.
    // We need to ensure the content inside is parsed as markdown.
    // marked.parse(content) inside render? 
    // No, because `transformCallouts` is called BEFORE marked.
    // So we should return HTML structure but the *content* part should be markdown.
    // However, Markdown inside HTML block is tricky.
    // We can use `marked` feature to handle this or just rely on the fact that we are generating `div`s.

    // Standard Markdown: Block-level HTML tags defined in spec interrupt paragraphs, and content inside is NOT parsed as markdown unless `markdown="1"` attribute is present (in some parsers) or if we indent it?
    // marked.js handles HTML. If we put markdown inside <div>, marked might not parse it by default.

    // Strategy:
    // Render the container HTML, but putting the inner markdown content back.
    // To ensure marked parses the inner content, we can parse it right here recursively?
    // Or we can construct custom HTML token if we were writing a marked extension.
    // Since we are doing pre-processing string manipulation:

    // Attempt 1: Pre-render content with marked inside here.
    // But wait, `marked.parse` is not yet available/configured fully? 
    // Any internal links/images transformations might need to run on it too.
    // Those run BEFORE marked. So if we run marked here, we are good?
    // Actually, `transformInternalLinks` runs AFTER marked in `processDocument` step 5.
    // Wait, `processDocument`:
    // 1. Frontmatter
    // 2. Transform Images/Links (Regex)
    // 3. Transform YouTube
    // 4. Protect Math
    // 5. Marked Parse
    // 6. Post-processing (Syntax Highlight, Mermaid, Restore Math, Internal Links HTML)

    // If we start `transformCallouts` before step 2, or between 3 and 4?
    // If we output HTML `div`s, marked will ignore the markdown inside by default.
    // WE MUST parse the inner markdown here for it to render correctly as rich text.

    // But `marked` is global? Yes.
    // So we can do:
    const contentHtml = marked.parse(callout.content.join('\n'));

    return `
<div class="callout" data-callout="${callout.type}">
  <div class="callout-title">
    <div class="callout-icon">${icon}</div>
    <div class="callout-title-text">${callout.title}</div>
  </div>
  <div class="callout-content">
    ${contentHtml}
  </div>
</div>
`;
}
