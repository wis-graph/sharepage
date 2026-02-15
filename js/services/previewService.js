/**
 * Preview Service
 * Handles metadata extraction from markdown files for link previews
 */

import { fetchFile } from '../core/fileApi.js?v=1771155027170';
import { getRawUrl } from './pathService.js?v=1771155027170';
import { parseFrontmatter } from './markdownService.js?v=1771155027170';

/**
 * Fetches and extracts preview data for a given note path
 * @param {string} targetPath 
 * @returns {Promise<Object>} Preview data (title, description, thumbnail)
 */
export async function getPreviewData(targetPath) {
    const rawContent = await fetchFile(targetPath);
    const { data, content } = parseFrontmatter(rawContent);

    // 1. Extract Title
    const title = data.title || targetPath.replace(/\.md$/, '');

    // 2. Extract Description/Snippet
    let description = data.description || data.summary || '';
    if (!description) {
        const plainText = content
            .replace(/!\[\[.*?\]\]/g, '') // remove obsidian images
            .replace(/!\[.*?\]\(.*?\)/g, '') // remove markdown images
            .replace(/[#*`_\[\]]/g, '') // remove markdown syntax
            .trim();
        description = plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');
    }

    // 3. Extract Thumbnail
    let thumbnail = data.thumbnail ? getRawUrl('_image_' + data.thumbnail) : null;
    if (!thumbnail) {
        const obsidianMatch = rawContent.match(/!\[\[([^\]]+)\]\]/);
        if (obsidianMatch) {
            thumbnail = getRawUrl('_image_' + obsidianMatch[1]);
        }
    }

    return { title, description, thumbnail };
}
