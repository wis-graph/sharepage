/**
 * Document Service - Document Processing Pipeline
 * Handles the transformation from Markdown to HTML
 */

import { parseFrontmatter, transformObsidianImageLinks, transformInternalLinks, slugify } from './markdownService.js?v=41000';
import { getRawUrl } from './pathService.js?v=41000';
import {
    applySyntaxHighlighting,
    renderMermaidDiagrams,
    protectMath,
    restoreMath,
    normalizeMermaidAliases,
    transformYouTubeLinks
} from './renderService.js?v=41000';
import { transformCallouts } from '../callouts.js?v=41000';
import { addHeadingIds } from '../toc.js?v=41000';

/**
 * Core processing pipeline: Markdown -> HTML
 * @param {string} filename 
 * @param {string} rawContent 
 * @returns {Object} Processed document data
 */
export async function processDocument(filename, rawContent) {
    console.log('[DocService] Original markdown length:', rawContent.length);

    // 1. Parse Frontmatter
    let { data, content } = parseFrontmatter(rawContent);
    console.log('[DocService] Content after frontmatter:', content.length);

    // 1.5. Normalize Mermaid Aliases
    content = normalizeMermaidAliases(content);

    // 1.6. Transform Callouts (before markdown parsing)
    content = transformCallouts(content);

    // 2. Transform Images
    content = transformObsidianImageLinks(content);

    // 2.1. Transform Internal Links
    content = transformInternalLinks(content);

    // 2.5. Transform YouTube Links
    content = transformYouTubeLinks(content);

    // 3. Protect Math
    content = protectMath(content);

    // 4. Parse Markdown into HTML
    // Set options for better Obsidian/GFM compatibility
    marked.use({
        gfm: true,
        breaks: true,
        mangle: false,
        headerIds: false
    });

    // Pre-process for CJK Bold boundaries
    content = content.replace(/(\*\*|__)(?=\S)([\s\S]+?)(?<=\S)\1/g, (match, p1, p2) => {
        if (p2.includes(p1)) return match;
        return `<strong>${p2}</strong>`;
    });

    let html = marked.parse(content);

    // 5. Post-processing HTML
    html = addHeadingIds(html);
    html = applySyntaxHighlighting(html);
    html = renderMermaidDiagrams(html);
    html = restoreMath(html);
    html = transformInternalLinks(html);

    // Extract Metadata for Head Tags
    let description = data.description || data.summary || data.excerpt || '';
    if (!description) {
        const plainText = content.replace(/[#*`_\[\]]/g, '').trim();
        description = plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');
    }

    let thumbnail = data.thumbnail ? getRawUrl('_image_' + data.thumbnail) : null;
    if (!thumbnail) {
        const obsidianMatch = rawContent.match(/!\[\[([^\]]+)\]\]/);
        let obsidianIndex = obsidianMatch ? obsidianMatch.index : Infinity;

        const markdownMatch = rawContent.match(/!\[([^\]]*)\]\(([^)]+)\)/);
        let markdownIndex = markdownMatch ? markdownMatch.index : Infinity;

        if (obsidianMatch || markdownMatch) {
            if (obsidianIndex < markdownIndex) {
                thumbnail = getRawUrl('_image_' + obsidianMatch[1]);
            } else if (markdownMatch) {
                const url = markdownMatch[2];
                const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
                const ytMatch = url.match(youtubeRegex);

                if (ytMatch && ytMatch[1]) {
                    thumbnail = `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
                } else {
                    thumbnail = url;
                }
            }
        }
    }

    return {
        html: html,
        tags: data.tags || [],
        title: filename.replace(/\.md$/, ''),
        metadata: {
            title: data.title || filename.replace(/\.md$/, ''),
            description: description,
            thumbnail: thumbnail,
            url: window.location.href
        }
    };
}
