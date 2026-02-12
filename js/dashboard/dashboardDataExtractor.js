import { fetchFile, getRawUrl, routes, transformObsidianImageLinks } from '../utils.js';

export function extractDashboardLinks(dashboardContent) {
  console.log('[Dashboard] Extracting links from dashboard...');

  const linkSet = new Set();
  const linkMatches = dashboardContent.matchAll(/\[\[([^\]]+)\]\]/g);

  for (const match of linkMatches) {
    let linkText = match[1];
    // Handle aliases like [[Actual Link|Display Name]]
    if (linkText.includes('|')) {
      linkText = linkText.split('|')[0];
    }
    const cleanLink = linkText.replace(/\.md$/, '').trim();
    linkSet.add(cleanLink);
    console.log('[Dashboard] Found link:', cleanLink);
  }

  const links = Array.from(linkSet);
  console.log('[Dashboard] Total unique links:', links.length, '→', links);
  return links;
}

function findRouteByLink(link, routes) {
  // Normalize link for comparison (Obsidian style)
  const normalizedLink = link.toLowerCase().replace(/\s+/g, '-').replace(/\.md$/, '');

  // 1. Try to find exact match in files
  let routeEntry = Object.entries(routes).find(([path, route]) => {
    const filenameWithoutExt = route.file.replace(/\.md$/, '').toLowerCase();
    return filenameWithoutExt === normalizedLink || path.slice(1).toLowerCase() === normalizedLink;
  });

  // 2. If not found, Auto-Discovery: register a new route
  if (!routeEntry) {
    console.log('[Dashboard] Auto-Discovering route for:', link);
    const path = '/' + normalizedLink;
    const file = link.endsWith('.md') ? link : link + '.md';

    // Register it globally
    routes[path] = {
      title: link.replace(/\.md$/, ''),
      file: file
    };

    return [path, routes[path]];
  }

  return routeEntry;
}

function extractMetadata(markdown, filename) {
  const frontmatterMatch = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  let title = filename.replace(/\.md$/, '').replace(/^_/, '').replace(/^note-/, '');
  let description = '';
  let thumbnail = null;

  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    const titleMatch = frontmatter.match(/^title:\s*(.+)$/m);
    if (titleMatch) {
      title = titleMatch[1].trim().replace(/^["']|["']$/g, '');
    }

    const thumbnailMatch = frontmatter.match(/^thumbnail:\s*(.+)$/m);
    if (thumbnailMatch) {
      thumbnail = thumbnailMatch[1].trim().replace(/^["']|["']$/g, '');
    }
  }

  const contentWithoutFrontmatter = frontmatterMatch
    ? markdown.replace(/^---\r?\n[\s\S]*?\r?\n---(\r?\n)?/, '')
    : markdown;

  const firstParagraph = contentWithoutFrontmatter.match(/^#+\s*(.+)$/m) ||
    contentWithoutFrontmatter.match(/^(?!\s*$|#+\s).+/m);

  if (firstParagraph) {
    description = firstParagraph[1]
      .replace(/[#*`_\[\]]/g, '')
      .substring(0, 150);
  }

  return {
    title: title.charAt(0).toUpperCase() + title.slice(1),
    description: description || 'No description available.',
    filename: filename,
    thumbnail: thumbnail
  };
}

function extractThumbnail(content, metadata) {
  if (metadata.thumbnail) {
    const url = getRawUrl('_image_' + metadata.thumbnail);
    console.log('[Thumbnail] Using thumbnail from frontmatter:', url);
    return url;
  }

  console.log('[Thumbnail] Searching for first image in content...');
  const imageMatch = content.match(/!\[\[([^\]]+)\]\]/);

  if (imageMatch) {
    console.log('[Thumbnail] Found image:', imageMatch[1]);
    return getRawUrl('_image_' + imageMatch[1]);
  }

  console.log('[Thumbnail] No image found');
  return null;
}

export async function extractNoteFromLink(link, routes) {
  console.log('[Dashboard] Processing link:', link);

  const route = findRouteByLink(link, routes);

  if (!route) {
    console.warn('[Dashboard] No route found for link:', link);
    return null;
  }

  const [path, routeData] = route;
  const note = {
    path,
    file: routeData.file,
    title: routeData.title
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
      thumbnail: thumbnail
    };

    console.log('[Dashboard] Note extracted:', enrichedNote.title);
    return enrichedNote;
  } catch (error) {
    console.error('[Dashboard] Error loading note:', note.file, error);
    return null;
  }
}

export async function loadAllNotes(dashboardContent, routes) {
  console.log('[Dashboard] ===== Loading dashboard notes START =====');

  try {
    const links = extractDashboardLinks(dashboardContent);
    console.log('[Dashboard] Links to process:', links);

    const notePromises = links.map(link => extractNoteFromLink(link, routes));
    const notes = await Promise.all(notePromises);
    const validNotes = notes.filter(note => note !== null);

    const sortedNotes = [...validNotes].sort((a, b) => a.title.localeCompare(b.title));

    console.log('[Dashboard] ===== Loading dashboard notes END =====');
    console.log('[Dashboard] Total notes loaded:', sortedNotes.length);
    console.log('[Dashboard] Notes:', sortedNotes.map(n => n.title));

    return sortedNotes;
  } catch (error) {
    console.error('[Dashboard] ===== Error loading dashboard =====');
    console.error('[Dashboard] Error details:', error);
    return [];
  }
}
