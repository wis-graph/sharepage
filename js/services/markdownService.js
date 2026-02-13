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
                    let value = trimmedLine.replace(/^-/, '').trim();
                    // Remove quotes if present
                    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                        value = value.slice(1, -1);
                    }
                    // Remove '#' prefix from tags
                    if (currentKey === 'tags') {
                        value = value.replace(/^#/, '');
                    }
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
                    result.data[key] = result.data[key] || []; // Initialize as array

                    // Case 1: Inline list [tag1, tag2]
                    if (value.startsWith('[') && value.endsWith(']')) {
                        value = value.slice(1, -1);
                        const tags = value.split(',').map(t => {
                            let tag = t.trim();
                            if ((tag.startsWith('"') && tag.endsWith('"')) || (tag.startsWith("'") && tag.endsWith("'"))) {
                                tag = tag.slice(1, -1);
                            }
                            return tag.replace(/^#/, '');
                        }).filter(t => t);
                        result.data[key] = [...result.data[key], ...tags];
                        currentKey = null; // Reset current key as we're done with tags
                    }
                    // Case 2: Inline comma-separated value
                    else if (value) {
                        const tags = value.split(',').map(t => t.trim().replace(/^#/, '')).filter(t => t);
                        // Only if there are actual values
                        if (tags.length > 0) {
                            result.data[key] = [...result.data[key], ...tags];
                            currentKey = null;
                        }
                    }
                    // Case 3: Empty value, implying subsequent lines have the list (handled in next iterations)
                } else {
                    // Normal key-value
                    let cleanValue = value;
                    if ((cleanValue.startsWith('"') && cleanValue.endsWith('"')) || (cleanValue.startsWith("'") && cleanValue.endsWith("'"))) {
                        cleanValue = cleanValue.slice(1, -1);
                    }
                    result.data[key] = cleanValue;
                }
            }
        });
    }

    // Extract inline tags from content: #tag but not # Heading
    // Skip code blocks (```...```) to be more accurate
    const contentForTags = result.content.replace(/```[\s\S]*?```/g, '');
    const inlineTagsMatch = contentForTags.matchAll(/(?:^|\s)#([^\s!@#$%^&*(),.?":{}|<>]+)/g);
    const inlineTags = Array.from(inlineTagsMatch).map(m => m[1]);

    // Merge and deduplicate tags
    const existingTags = result.data.tags || [];
    const allTags = [...new Set([...existingTags, ...inlineTags])];
    result.data.tags = allTags;

    return result;
}
