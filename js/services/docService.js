/**
 * Document Service - Document Processing Pipeline
 * Handles the transformation from Markdown to HTML
 */

import { parseFrontmatter, transformObsidianImageLinks, transformInternalLinks, slugify } from './markdownService.js?v=1771154293083';
import { getRawUrl } from './pathService.js?v=1771154293083';
import {
    applySyntaxHighlighting,
    renderMermaidDiagrams,
    protectMath,
    restoreMath,
    normalizeMermaidAliases,
    transformYouTubeLinks
} from './renderService.js?v=1771154293083';
import { transformCallouts } from './calloutService.js?v=1771154293083';
import { addHeadingIds } from './tocService.js?v=1771154293083';

/**
 * Core processing pipeline: Markdown -> HTML
 * @param {string} filename 
 * @param {string} rawContent 
 * @returns {Object} Processed document data
 */
export async function processDocument(filename, rawContent) {
    console.log('[DocService] Processing document:', filename);

    // 1. Initial Parsing & Pre-processing
    let { data, content } = parseFrontmatter(rawContent);
    content = normalizeMermaidAliases(content);
    content = transformCallouts(content);
    content = transformObsidianImageLinks(content);
    content = transformInternalLinks(content);
    content = transformYouTubeLinks(content);

    // 2. Math Protection (Stateless)
    const { content: protectedContent, mathMap } = protectMath(content);
    content = protectedContent;

    // 3. Markdown to HTML Transformation
    configureMarked();
    content = preprocessMarkdown(content);
    let html = marked.parse(content);

    // 4. Post-processing HTML
    html = addHeadingIds(html);
    html = applySyntaxHighlighting(html);
    html = renderMermaidDiagrams(html);
    html = restoreMath(html, mathMap);
    html = transformInternalLinks(html);

    // 5. Metadata Extraction
    const description = extractDescription(data, content);
    const thumbnail = extractThumbnail(data, rawContent);

    return {
        html: html,
        tags: data.tags || [],
        title: filename.replace(/\.md$/, '').replace(/_/g, ' '),
        metadata: {
            title: data.title || filename.replace(/\.md$/, '').replace(/_/g, ' '),
            description: description,
            thumbnail: thumbnail,
            url: window.location.href
        }
    };
}

/**
 * Configure marked.js options
 */
function configureMarked() {
    marked.use({
        gfm: true,
        breaks: true,
        mangle: false,
        headerIds: false
    });
}

/**
 * Pre-process markdown for specific fixes (e.g., CJK Bold)
 */
function preprocessMarkdown(content) {
    // Pre-process for CJK Bold boundaries
    return content.replace(/(\*\*|__)(?=\S)([\s\S]+?)(?<=\S)\1/g, (match, p1, p2) => {
        if (p2.includes(p1)) return match;
        return `<strong>${p2}</strong>`;
    });
}

/**
 * Extract or generate description for SEO
 */
function extractDescription(data, content) {
    let description = data.description || data.summary || data.excerpt || '';
    if (!description) {
        const plainText = content.replace(/[#*`_\[\]]/g, '').trim();
        description = plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');
    }
    return description;
}

/**
 * Extract thumbnail URL from frontmatter or content
 */
function extractThumbnail(data, rawContent) {
    if (data.thumbnail) {
        return getRawUrl('_image_' + data.thumbnail);
    }

    const obsidianMatch = rawContent.match(/!\[\[([^\]]+)\]\]/);
    const markdownMatch = rawContent.match(/!\[([^\]]*)\]\(([^)]+)\)/);

    if (!obsidianMatch && !markdownMatch) return null;

    const obsidianIndex = obsidianMatch ? obsidianMatch.index : Infinity;
    const markdownIndex = markdownMatch ? markdownMatch.index : Infinity;

    if (obsidianIndex < markdownIndex) {
        return getRawUrl('_image_' + obsidianMatch[1]);
    } else if (markdownMatch) {
        const url = markdownMatch[2];
        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const ytMatch = url.match(youtubeRegex);

        if (ytMatch && ytMatch[1]) {
            return `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
        }
        return url;
    }
    return null;
}
