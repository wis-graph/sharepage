import { fetchFile, getRawUrl, transformObsidianImageLinks } from '../utils.js';

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

export async function extractNoteFromLink(link) {
  console.log('[Dashboard] Processing link:', link);

  const filename = link.endsWith('.md') ? link : link + '.md';
  const path = '/' + link.toLowerCase().replace(/\s+/g, '-').replace(/\.md$/, '');

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
      path: '/' + note.file.replace(/\.md$/, '') // Ensure path is consistent with catch-all router
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
