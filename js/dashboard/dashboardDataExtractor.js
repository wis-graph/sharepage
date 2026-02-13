// Migrated to use new layered modules
import { fetchFile, getRawUrl } from '../utils.js?v=40000';
import { getNotePath } from '../services/pathService.js?v=40000';
import { transformObsidianImageLinks, parseFrontmatter } from '../services/markdownService.js?v=40000';

/**
 * Extracts links grouped by sections based on ## Headings
 */
export function extractSectionedLinks(dashboardContent) {
  console.log('[Dashboard] Extracting sectioned links...');
  const sections = [];
  let currentSection = { title: 'General', links: [] };

  const lines = dashboardContent.split('\n');
  lines.forEach(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    // Section Heading (## Title)
    const headingMatch = trimmedLine.match(/^##\s+(.+)$/);
    if (headingMatch) {
      if (currentSection.links.length > 0 || currentSection.title !== 'General') {
        sections.push(currentSection);
      }
      currentSection = { title: headingMatch[1].trim(), links: [] };
      return;
    }

    // Link Match ([[Link]])
    const linkMatch = trimmedLine.match(/\[\[([^\]]+)\]\]/);
    if (linkMatch) {
      let linkText = linkMatch[1];
      if (linkText.includes('|')) {
        linkText = linkText.split('|')[0];
      }
      const cleanLink = linkText.replace(/\.md$/, '').trim();
      // Avoid duplicates within the same section
      if (!currentSection.links.includes(cleanLink)) {
        currentSection.links.push(cleanLink);
        console.log(`[Dashboard] Found link in section [${currentSection.title}]:`, cleanLink);
      }
    }
  });

  if (currentSection.links.length > 0) {
    sections.push(currentSection);
  }

  return sections;
}

export function extractDashboardLinks(dashboardContent) {
  // Flat version for backward compatibility if needed, using the sectioned logic
  const sections = extractSectionedLinks(dashboardContent);
  return sections.flatMap(s => s.links);
}

function extractMetadata(markdown, filename) {
  // Use core utility for consistent parsing
  const { data, content: contentWithoutFrontmatter } = parseFrontmatter(markdown);

  let title = data.title || filename.replace(/\.md$/, '').replace(/^_/, '');
  let description = data.description || data.summary || data.excerpt || '';
  let thumbnail = data.thumbnail || null;

  if (!description) {
    // Extract first heading or first line
    const firstParagraph = contentWithoutFrontmatter.match(/^#+\s*(.+)$/m) ||
      contentWithoutFrontmatter.match(/^(?!\s*$|#+\s).+/m);

    if (firstParagraph) {
      description = firstParagraph[1]
        .replace(/[#*`_\[\]]/g, '')
        .trim()
        .substring(0, 150);
    }
  }

  return {
    title: title.charAt(0).toUpperCase() + title.slice(1),
    description: description || 'No description available.',
    filename: filename,
    thumbnail: thumbnail,
    tags: data.tags || []
  };
}

function extractThumbnail(content, metadata) {
  if (metadata.thumbnail) {
    const url = getRawUrl('_image_' + metadata.thumbnail);
    console.log('[Thumbnail] Using thumbnail from frontmatter:', url);
    return url;
  }

  // Strip code blocks to avoid false positives in guides/documentation
  // Remove fenced code blocks and inline code
  const contentCleaned = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '');

  // 1. Search for Obsidian Image ![[...]]
  const obsidianMatch = contentCleaned.match(/!\[\[([^\]]+)\]\]/);
  let obsidianIndex = obsidianMatch ? obsidianMatch.index : Infinity;

  // 2. Search for Markdown Image ![...](...)
  const markdownMatch = contentCleaned.match(/!\[([^\]]*)\]\(([^)]+)\)/);
  let markdownIndex = markdownMatch ? markdownMatch.index : Infinity;

  // Determine which comes first
  if (obsidianIndex < markdownIndex) {
    console.log('[Thumbnail] Found Obsidian image:', obsidianMatch[1]);
    return getRawUrl('_image_' + obsidianMatch[1]);
  } else if (markdownMatch) {
    const url = markdownMatch[2];

    // Check if it's a YouTube URL
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const ytMatch = url.match(youtubeRegex);

    if (ytMatch && ytMatch[1]) {
      console.log('[Thumbnail] Found YouTube video, extracting thumbnail:', ytMatch[1]);
      return `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
    }

    console.log('[Thumbnail] Found Markdown image:', url);
    return url;
  }

  console.log('[Thumbnail] No image found');
  return null;
}

export async function extractNoteFromLink(link) {
  console.log('[Dashboard] Processing link:', link);

  const filename = link.endsWith('.md') ? link : link + '.md';
  const path = getNotePath(link.replace(/\.md$/, ''));

  const note = {
    path: path, // This path is used for navigation (#/filename)
    file: filename,
    title: link.replace(/\.md$/, '')
  };

  try {
    console.log('[Dashboard] Fetching note content:', note.file);
    const content = await fetchFile(note.file);
    console.log('[Dashboard] Note content length:', content.length);

    const metadata = extractMetadata(content, note.file);
    const thumbnail = extractThumbnail(content, metadata);

    const enrichedNote = {
      ...note,
      title: metadata.title,
      description: metadata.description,
      thumbnail: thumbnail,
      tags: metadata.tags || [],
      path: getNotePath(note.file.replace(/\.md$/, '')) // Use centralized path function
    };

    console.log('[Dashboard] Note extracted:', enrichedNote.title);
    return enrichedNote;
  } catch (error) {
    console.error('[Dashboard] Error loading note:', note.file, error);
    return null;
  }
}

export async function loadPageNotes(dashboardContent, pageNumber, itemsPerPage) {
  console.log('[Dashboard] ===== Loading page', pageNumber, 'notes START =====');

  try {
    const allLinks = extractDashboardLinks(dashboardContent);
    console.log('[Dashboard] Total links found:', allLinks.length);

    const startIndex = (pageNumber - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, allLinks.length);
    const linksToLoad = allLinks.slice(startIndex, endIndex);

    console.log('[Dashboard] Links for current page:', linksToLoad);

    const notePromises = linksToLoad.map(link => extractNoteFromLink(link));
    const notes = await Promise.all(notePromises);
    const validNotes = notes.filter(note => note !== null);

    console.log('[Dashboard] Loaded', validNotes.length, 'notes for page', pageNumber);

    return {
      notes: validNotes,
      totalLinks: allLinks.length
    };
  } catch (error) {
    console.error('[Dashboard] Error during page loading:', error);
    return {
      notes: [],
      totalLinks: 0
    };
  }
}

/**
 * Loads all notes for all sections, plus auto-discovered unlisted notes
 * @param {string} dashboardContent 
 */
export async function loadSectionedDashboard(dashboardContent) {
  // 1. Load explicit sections
  const structuredLinks = extractSectionedLinks(dashboardContent);
  const result = [];
  const processedNotes = new Set(); // Track notes added to prevent duplicates

  console.log('[Dashboard] Loading explicit sections...');
  for (const section of structuredLinks) {
    const notePromises = section.links.map(link => extractNoteFromLink(link));
    const notes = await Promise.all(notePromises);
    const validNotes = notes.filter(n => n !== null);

    validNotes.forEach(n => processedNotes.add(n.file));

    result.push({
      title: section.title,
      notes: validNotes,
      count: validNotes.length
    });
  }

  // 2. Load auto-dicovered notes
  try {
    console.log('[Dashboard] Checking for unlisted notes...');
    // We fetch from posts/file_index.json because sync.js puts it there. 
    // Wait, sync.js writes to posts/ but utils fetch logic might need tweaks if we ask for .json
    // Let's rely on fetchFile to just get it if path is right. fetchFile uses getRawUrl.
    // getRawUrl logic: if no extension, add .md. If .json, it might just return.
    // Let's try direct fetch to avoid markdown logic interference for now, or just use fetchFile with full path.
    // Actually, getRawUrl handles .json safely? line 16 check says !targetFile.includes('.')

    // We need to fetch 'posts/file_index.json' relative to root.
    // In local serve (npx serve ./), root is the current directory.
    // In GitHub Pages with project path, we need relative or absolute path handling.

    // IS_LOCAL is boolean.
    // If IS_LOCAL, we are at root /. So /posts/file_index.json is correct.
    // If NOT IS_LOCAL, we are at /sharepage/. So ./posts/file_index.json is safer.

    const indexUrl = './posts/file_index.json?v=' + Date.now();
    const response = await fetch(indexUrl);

    if (response.ok) {
      const allFiles = await response.json();
      const unlistedFiles = allFiles.filter(f => !processedNotes.has(f));

      if (unlistedFiles.length > 0) {
        console.log('[Dashboard] Found unlisted notes:', unlistedFiles.length);
        const unlistedPromises = unlistedFiles.map(file => extractNoteFromLink(file));
        const unlistedNotes = await Promise.all(unlistedPromises);
        const validUnlisted = unlistedNotes.filter(n => n !== null);

        if (validUnlisted.length > 0) {
          result.push({
            title: 'Others', // Section for auto-discovered notes
            notes: validUnlisted,
            count: validUnlisted.length
          });
        }
      }
    } else {
      console.warn('[Dashboard] file_index.json not found, skipping auto-discovery.');
    }
  } catch (e) {
    console.error('[Dashboard] Auto-discovery failed:', e);
  }

  return result;
}
