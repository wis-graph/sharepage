/**
 * Markdown Service
 * Handles markdown parsing and transformation
 */

import { getNotePath, getRawUrl } from './pathService.js';

/**
 * Slugify text for URL-friendly format
 */
export function slugify(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[\s]+/g, '-')
        .replace(/[^\w\-\uAC00-\uD7A3]+/g, '') // Keep English, Numbers, -, and Korean
        .replace(/^-+|-+$/g, '');
}

/**
 * Transform Obsidian internal links [[...]] to HTML anchors
 */
export function transformInternalLinks(html) {
    return html.replace(
        /\[\[(.*?)\]\]/g,
        (match, content) => {
            // content could be "Page Name" or "Page Name|Alias" or "#Heading" or "Page#Heading"
            const parts = content.split('|');
            const linkTarget = parts[0];
            const linkAlias = parts[1]; // undefined if no alias

            // Check for anchor link
            if (linkTarget.startsWith('#')) {
                // Current page anchor: [[#Heading]]
                const heading = linkTarget.substring(1);
                const sluggified = slugify(heading);
                const text = linkAlias || heading;
                return `<a href="#${sluggified}" class="internal-link anchor-link">${text}</a>`;
            } else if (linkTarget.includes('#')) {
                // Specific page anchor: [[Page#Heading]]
                const [page, heading] = linkTarget.split('#');
                const sluggifiedHeading = slugify(heading);
                const noteName = page.replace(/\.md$/, '');
                const path = getNotePath(noteName);
                const text = linkAlias || (page + ' > ' + heading);
                return `<a href="${path}#${sluggifiedHeading}" class="internal-link">${text}</a>`;
            } else {
                // Normal page link
                const noteName = linkTarget.replace(/\.md$/, '');
                const path = getNotePath(noteName);
                const text = linkAlias || noteName;
                return `<a href="${path}" class="internal-link">${text}</a>`;
            }
        }
    );
}

/**
 * Transform Obsidian image links ![[...]] to standard markdown
 */
export function transformObsidianImageLinks(markdown) {
    console.log('[MarkdownService] Converting Obsidian image links');

    return markdown.replace(
        /!\[\[(.*?)\]\]/g,
        (match, filename) => {
            // transform to standard markdown using images/ folder
            const url = getRawUrl('_image_' + filename);
            return `![${filename}](${url})`;
        }
    );
}

/**
 * Parse YAML frontmatter from markdown
 */
export function parseFrontmatter(markdown) {
    const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
    const match = markdown.match(frontmatterRegex);

    const result = {
        data: {},
        content: markdown
    };

    if (match) {
        const yamlContent = match[1];
        result.content = markdown.replace(frontmatterRegex, '').trim();

        const lines = yamlContent.split('\n');
        let currentKey = null;

        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return;

            // Handle list items for the current key (e.g. tags)
            if (currentKey && (trimmedLine.startsWith('- ') || trimmedLine.startsWith('-'))) {
                if (Array.isArray(result.data[currentKey])) {
                    let value = cleanValue(trimmedLine.replace(/^-/, '').trim());
                    if (currentKey === 'tags') value = value.replace(/^#/, '');
                    result.data[currentKey].push(value);
                }
                return;
            }

            // Parse key-value pairs
            const separatorIndex = line.indexOf(':');
            if (separatorIndex !== -1) {
                const key = line.substring(0, separatorIndex).trim();
                let value = line.substring(separatorIndex + 1).trim();

                currentKey = key;

                if (key === 'tags') {
                    result.data[key] = parseTags(value, result.data[key]);
                    // If inline list was processed, reset currentKey to prevent adding subsequent lines to tags
                    if (value.startsWith('[') || (value && !value.includes(','))) {
                        // Keep currentKey if it's potentially a multi-line list (empty value)
                        if (!value) currentKey = key;
                        else currentKey = null;
                    }
                } else {
                    result.data[key] = cleanValue(value);
                }
            }
        });
    }

    // Extract inline tags and merge
    const inlineTags = extractInlineTags(result.content);
    const existingTags = result.data.tags || [];
    result.data.tags = [...new Set([...existingTags, ...inlineTags])];

    return result;
}

/**
 * Clean quotes and trim whitespace from a YAML value
 */
function cleanValue(value) {
    if (!value) return '';
    let clean = value.trim();
    if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
        clean = clean.slice(1, -1);
    }
    return clean;
}

/**
 * Parse tags from a YAML value (supports inline list [a,b] and comma-separated)
 */
function parseTags(value, existingTags = []) {
    let tags = existingTags;

    // Case 1: Inline list [tag1, tag2]
    if (value.startsWith('[') && value.endsWith(']')) {
        const inlineTags = value.slice(1, -1).split(',').map(t => {
            return cleanValue(t).replace(/^#/, '');
        }).filter(t => t);
        tags = [...tags, ...inlineTags];
    }
    // Case 2: Inline comma-separated value
    else if (value) {
        const inlineTags = value.split(',').map(t => {
            return cleanValue(t).replace(/^#/, '');
        }).filter(t => t);
        if (inlineTags.length > 0) {
            tags = [...tags, ...inlineTags];
        }
    }

    return tags;
}

/**
 * Extract inline tags (#tag) from content, excluding code blocks
 */
export function extractInlineTags(content) {
    const contentForTags = content.replace(/```[\s\S]*?```/g, '');
    const inlineTagsMatch = contentForTags.matchAll(/(?:^|\s)#([^\s!@#$%^&*(),.?":{}|<>]+)/g);
    return Array.from(inlineTagsMatch).map(m => m[1]);
}

/**
 * Strips obsidian links and markdown formatting to get plain text
 */
export function cleanPlainText(text) {
    if (!text) return '';

    return text
        // 1. Handle Obsidian links: [[Page Name|Alias]] -> Alias, [[Page Name]] -> Page Name
        .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
        .replace(/\[\[([^\]]+)\]\]/g, '$1')
        // 2. Handle Markdown links: [Text](URL) -> Text
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        // 3. Handle Bold/Italic/Strikethrough/Code
        .replace(/(\*\*|__|~~|`)(.*?)\1/g, '$2')
        .replace(/(\*|_)(.*?)\1/g, '$2')
        // 4. Remove residual symbols like # at start or [] leftover
        .replace(/[#*`_~\[\]]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}
