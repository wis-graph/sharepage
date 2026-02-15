/**
 * Dashboard Data Service
 * Handles extracting and processing data for the dashboard
 */

import { fetchFile } from '../core/fileApi.js?v=1771154293083';
import { getNotePath, getRawUrl } from './pathService.js?v=1771154293083';
import { parseFrontmatter, cleanPlainText } from './markdownService.js?v=1771154293083';

/**
 * Extracts links grouped by sections based on ## Headings
 * @param {string} dashboardContent 
 */
export function extractSectionedLinks(dashboardContent) {
    const sections = [];
    let currentSection = { title: 'General', links: [] };

    const lines = dashboardContent.split('\n');
    lines.forEach(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        const headingMatch = trimmedLine.match(/^##\s+(.+)$/);
        if (headingMatch) {
            if (currentSection.links.length > 0 || currentSection.title !== 'General') {
                sections.push(currentSection);
            }
            currentSection = { title: headingMatch[1].trim(), links: [] };
            return;
        }

        const linkMatch = trimmedLine.match(/\[\[([^\]]+)\]\](?:\s*(.+))?/);
        if (linkMatch) {
            let linkText = linkMatch[1];
            const extraInfo = linkMatch[2] ? linkMatch[2].trim() : null;

            if (linkText.includes('|')) {
                linkText = linkText.split('|')[0];
            }
            const cleanLink = linkText.replace(/\.md$/, '').trim();

            // Check if already exists to avoid duplicates, but update with extraInfo if found
            const existing = currentSection.links.find(l => l.name === cleanLink);
            if (!existing) {
                currentSection.links.push({
                    name: cleanLink,
                    date: extraInfo // This can be a date string like 2024-02-15
                });
            }
        }
    });

    if (currentSection.links.length > 0) {
        sections.push(currentSection);
    }

    return sections;
}

/**
 * Extracts metadata and content from a note markdown
 */
function extractMetadata(markdown, filename) {
    const { data, content: contentWithoutFrontmatter } = parseFrontmatter(markdown);

    let title = data.title || filename.replace(/\.md$/, '').replace(/^_/, '').replace(/_/g, ' ');
    let description = data.description || data.summary || data.excerpt || '';
    let thumbnail = data.thumbnail || null;

    if (!description) {
        const firstParagraph = contentWithoutFrontmatter.match(/^#+\s*(.+)$/m) ||
            contentWithoutFrontmatter.match(/^(?!\s*$|#+\s).+/m);

        if (firstParagraph) {
            description = firstParagraph[1];
        }
    }

    // Always clean the description text
    description = cleanPlainText(description).substring(0, 150);

    return {
        title: title.charAt(0).toUpperCase() + title.slice(1),
        description: description || 'No description available.',
        filename: filename,
        thumbnail: thumbnail,
        tags: data.tags || [],
        type: data.type || data.source_type || null
    };
}

/**
 * Extracts a thumbnail URL from content or metadata
 */
function extractThumbnail(content, metadata) {
    if (metadata.thumbnail) {
        return getRawUrl('_image_' + metadata.thumbnail);
    }

    const contentCleaned = content
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`[^`]*`/g, '');

    const obsidianMatch = contentCleaned.match(/!\[\[([^\]]+)\]\]/);
    const obsidianIndex = obsidianMatch ? obsidianMatch.index : Infinity;

    const markdownMatch = contentCleaned.match(/!\[([^\]]*)\]\(([^)]+)\)/);
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

/**
 * Enriches a link with metadata and thumbnail
 */
export async function extractNoteFromLink(linkName, sortOrder = [], manualDate = null) {
    if (!linkName || typeof linkName !== 'string') {
        console.warn('[DashboardDataService] Invalid linkName ignored:', linkName);
        return null;
    }

    const filename = linkName.endsWith('.md') ? linkName : linkName + '.md';
    const note = {
        file: filename,
        title: linkName.replace(/\.md$/, '').replace(/_/g, ' ')
    };

    try {
        const content = await fetchFile(note.file);
        const { data } = parseFrontmatter(content);
        const metadata = extractMetadata(content, note.file);
        const thumbnail = extractThumbnail(content, metadata);

        // Try to get a sortable date
        let sortDate = 0;
        if (manualDate) {
            sortDate = new Date(manualDate).getTime();
        } else if (data.date) {
            sortDate = new Date(data.date).getTime();
        } else if (sortOrder.indexOf(filename) !== -1) {
            // Use the index in the file_index as a backup
            sortDate = sortOrder.length - sortOrder.indexOf(filename);
        }

        return {
            ...note,
            title: metadata.title,
            description: metadata.description,
            thumbnail: thumbnail,
            tags: metadata.tags || [],
            type: metadata.type,
            date: manualDate || data.date || null,
            sortDate: sortDate,
            path: getNotePath(note.file.replace(/\.md$/, ''))
        };
    } catch (error) {
        console.error('[DashboardDataService] Error loading note:', note.file, error);
        return null;
    }
}

/**
 * Loads all notes including auto-discovered ones
 */
export async function loadSectionedDashboard(dashboardContent) {
    // 1. Fetch file index for sorting backup and auto-discovery
    let allFiles = [];
    try {
        const indexUrl = './posts/file_index.json?v=' + Date.now();
        const response = await fetch(indexUrl);
        if (response.ok) {
            allFiles = await response.json();
        }
    } catch (e) {
        // Silent fail; file_index.json is optional for auxiliary features
        allFiles = [];
    }

    const structuredLinks = extractSectionedLinks(dashboardContent);
    const result = [];
    const processedNotes = new Set();

    // 2. Load structured sections
    for (const section of structuredLinks) {
        const notePromises = section.links.map(linkInfo => {
            return extractNoteFromLink(linkInfo.name, allFiles, linkInfo.date);
        });
        const notes = await Promise.all(notePromises);
        let validNotes = notes.filter(n => n !== null);

        // Sort notes within section by date descending
        validNotes.sort((a, b) => b.sortDate - a.sortDate);

        validNotes.forEach(n => processedNotes.add(n.file));

        if (validNotes.length > 0) {
            result.push({
                title: section.title,
                notes: validNotes,
                count: validNotes.length
            });
        }
    }

    // 3. Auto-discovery for unlisted files
    if (allFiles.length > 0) {
        const unlistedFiles = allFiles.filter(f => !processedNotes.has(f));

        if (unlistedFiles.length > 0) {
            const unlistedPromises = unlistedFiles.map(file => extractNoteFromLink(file, allFiles));
            const unlistedNotes = await Promise.all(unlistedPromises);
            const validUnlisted = unlistedNotes.filter(n => n !== null);

            if (validUnlisted.length > 0) {
                // Separate YouTube notes from others
                const youtubeNotes = validUnlisted.filter(n => {
                    const isYtType = n.type && n.type.toLowerCase() === 'youtube';
                    const hasYtThumb = n.thumbnail && n.thumbnail.includes('youtube.com/vi/');
                    return isYtType || hasYtThumb;
                });
                const otherNotes = validUnlisted.filter(n => !youtubeNotes.includes(n));

                // Add to YouTube section
                if (youtubeNotes.length > 0) {
                    const existingYtSection = result.find(s => s.title === 'YouTube');
                    if (existingYtSection) {
                        existingYtSection.notes.push(...youtubeNotes);
                        // Re-sort YouTube section
                        existingYtSection.notes.sort((a, b) => b.sortDate - a.sortDate);
                        existingYtSection.count = existingYtSection.notes.length;
                    } else {
                        youtubeNotes.sort((a, b) => b.sortDate - a.sortDate);
                        result.push({
                            title: 'YouTube',
                            notes: youtubeNotes,
                            count: youtubeNotes.length
                        });
                    }
                }

                // Add remaining to Others section
                if (otherNotes.length > 0) {
                    otherNotes.sort((a, b) => b.sortDate - a.sortDate);
                    result.push({
                        title: 'Others',
                        notes: otherNotes,
                        count: otherNotes.length
                    });
                }
            }
        }
    }

    return result;
}
