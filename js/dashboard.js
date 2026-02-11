import { fetchFile, getRawUrl, routes, PAGINATION_ITEMS_PER_PAGE } from './utils.js';

let currentPage = 1;
let allNotes = [];

function extractDashboardLinks(dashboardContent) {
  console.log('[Dashboard] Extracting links from dashboard...');

  const linkSet = new Set();
  const linkMatches = dashboardContent.matchAll(/\[\[([^\]]+)\]\]/g);

  for (const match of linkMatches) {
    const linkText = match[1];
    const cleanLink = linkText.replace(/\.md$/, '').trim();
    linkSet.add(cleanLink);
    console.log('[Dashboard] Found link:', cleanLink);
  }

  const links = Array.from(linkSet);
  console.log('[Dashboard] Total unique links:', links.length, '→', links);
  return links;
}

function extractMetadata(markdown, filename) {
  const frontmatterMatch = markdown.match(/^---\n([\s\S]*?)\n---/);
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
    ? markdown.replace(/^---\n[\s\S]*?\n---\n/, '')
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

function extractFirstImage(markdown) {
  console.log('[Thumbnail] Searching for first image in content...');

  const imageMatch = markdown.match(/!\[\[([^\]]+)\]\]/);
  if (imageMatch) {
    console.log('[Thumbnail] Found image:', imageMatch[1]);
    return getRawUrl('_image_' + imageMatch[1]);
  }

  console.log('[Thumbnail] No image found');
  return null;
}

export async function loadDashboardNotes() {
  console.log('[Dashboard] ===== Loading dashboard notes START =====');

  try {
    console.log('[Dashboard] Fetching _home.md...');
    const dashboardContent = await fetchFile('_home.md');
    console.log('[Dashboard] _home.md length:', dashboardContent.length);

    const links = extractDashboardLinks(dashboardContent);
    console.log('[Dashboard] Links to process:', links);

    allNotes = [];

    for (const link of links) {
      console.log('[Dashboard] Processing link:', link);

      const route = Object.entries(routes).find(([path, route]) => {
        const filenameWithoutExt = route.file.replace(/\.md$/, '');
        const match = filenameWithoutExt === link || path === '/' + link;
        if (match) {
          console.log('[Dashboard] Matched route:', path, '→', route.file);
        }
        return match;
      });

      if (route) {
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
          note.title = metadata.title;
          note.description = metadata.description;
          console.log('[Dashboard] Note metadata:', metadata);

          if (metadata.thumbnail) {
            note.thumbnail = getRawUrl('_image_' + metadata.thumbnail);
            console.log('[Dashboard] Using thumbnail from frontmatter:', note.thumbnail);
          } else {
            const firstImage = extractFirstImage(content);
            note.thumbnail = firstImage;
            console.log('[Dashboard] Using first image:', note.thumbnail || 'None');
          }

          allNotes.push(note);
          console.log('[Dashboard] Added note to list:', note.title);
        } catch (error) {
          console.error('[Dashboard] Error loading note:', note.file, error);
        }
      } else {
        console.warn('[Dashboard] No route found for link:', link);
      }
    }

    allNotes.sort((a, b) => a.title.localeCompare(b.title));
    console.log('[Dashboard] ===== Loading dashboard notes END =====');
    console.log('[Dashboard] Total notes loaded:', allNotes.length);
    console.log('[Dashboard] Notes:', allNotes.map(n => n.title));
  } catch (error) {
    console.error('[Dashboard] ===== Error loading dashboard =====');
    console.error('[Dashboard] Error details:', error);
    allNotes = [];
  }
}

export function renderDashboardPage(page) {
  console.log('[Dashboard] ===== Rendering dashboard page', page, 'START =====');

  const startIndex = (page - 1) * PAGINATION_ITEMS_PER_PAGE;
  const endIndex = startIndex + PAGINATION_ITEMS_PER_PAGE;
  const notesToShow = allNotes.slice(startIndex, endIndex);
  const totalPages = Math.ceil(allNotes.length / PAGINATION_ITEMS_PER_PAGE);

  console.log('[Dashboard] Pagination info:', {
    total: allNotes.length,
    page: page,
    totalPages: totalPages,
    startIndex: startIndex,
    endIndex: endIndex,
    showing: notesToShow.length
  });

  let html = '';

  if (allNotes.length === 0) {
    html += '<div class="loading">No notes found.</div>';
    return html;
  }

  html += '<div class="dashboard-grid">';

  for (const note of notesToShow) {
    console.log('[Dashboard] Rendering card for:', note.title, '(path:', note.path + ')');

    let thumbnailHtml;

    if (note.thumbnail) {
      thumbnailHtml = `<img class="note-card-thumbnail" src="${note.thumbnail}" alt="${note.title}" loading="lazy">`;
      console.log('[Dashboard] Card thumbnail:', note.thumbnail);
    } else {
      thumbnailHtml = `
        <div class="note-card-thumbnail-placeholder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
        </div>
      `;
      console.log('[Dashboard] Card thumbnail: using placeholder');
    }

    html += `
      <div class="note-card" onclick="window.location.hash='${note.path}'">
        ${thumbnailHtml}
        <div class="note-card-content">
          <div class="note-card-title">${note.title}</div>
          <div class="note-card-preview">${note.description}</div>
          <div class="note-card-footer">
            <span class="note-card-tag">Note</span>
            <span>Read →</span>
          </div>
        </div>
      </div>
    `;
  }

  html += '</div>';

  if (totalPages > 1) {
    html += '<div class="pagination">';

    if (page > 1) {
      html += `<button onclick="goToPage(${page - 1})">Previous</button>`;
    }

    for (let i = 1; i <= totalPages; i++) {
      html += `<button onclick="goToPage(${i})" ${i === page ? 'class="active"' : ''}>${i}</button>`;
    }

    if (page < totalPages) {
      html += `<button onclick="goToPage(${page + 1})">Next</button>`;
    }

    html += '</div>';
  }

  console.log('[Dashboard] ===== Rendering dashboard page', page, 'END =====');
  return html;
}

export function goToPage(page) {
  currentPage = page;
  const html = renderDashboardPage(page);
  document.getElementById('app').innerHTML = html;
  window.scrollTo(0, 0);
}
