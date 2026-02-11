import { fetchFile, getRawUrl, routes, PAGINATION_ITEMS_PER_PAGE } from './utils.js';

let currentPage = 1;
let allNotes = [];

function extractDashboardLinks(dashboardContent) {
  console.log('[Dashboard] Extracting links from dashboard...');

  const links = [];
  const linkMatches = dashboardContent.matchAll(/\[\[([^\]]+)\]\]/g);

  for (const match of linkMatches) {
    const linkText = match[1];
    const cleanLink = linkText.replace(/\.md$/, '').trim();
    links.push(cleanLink);
  }

  console.log('[Dashboard] Found', links.length, 'links in dashboard');
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
  console.log('[Dashboard] Loading dashboard notes...');

  try {
    const dashboardContent = await fetchFile('_home.md');
    const links = extractDashboardLinks(dashboardContent);

    allNotes = [];

    for (const link of links) {
      const route = Object.entries(routes).find(([path, route]) => {
        const filenameWithoutExt = route.file.replace(/\.md$/, '');
        return filenameWithoutExt === link || path === '/' + link;
      });

      if (route) {
        const [path, routeData] = route;
        const note = {
          path,
          file: routeData.file,
          title: routeData.title
        };

        try {
          const content = await fetchFile(note.file);
          const metadata = extractMetadata(content, note.file);
          note.title = metadata.title;
          note.description = metadata.description;

          if (metadata.thumbnail) {
            note.thumbnail = getRawUrl('_image_' + metadata.thumbnail);
          } else {
            const firstImage = extractFirstImage(content);
            note.thumbnail = firstImage;
          }

          allNotes.push(note);
        } catch (error) {
          console.error('[Dashboard] Error loading note:', note.file, error);
        }
      } else {
        console.warn('[Dashboard] No route found for link:', link);
      }
    }

    allNotes.sort((a, b) => a.title.localeCompare(b.title));
    console.log('[Dashboard] Loaded', allNotes.length, 'notes');
  } catch (error) {
    console.error('[Dashboard] Error loading dashboard:', error);
    allNotes = [];
  }
}

export function renderDashboardPage(page) {
  const startIndex = (page - 1) * PAGINATION_ITEMS_PER_PAGE;
  const endIndex = startIndex + PAGINATION_ITEMS_PER_PAGE;
  const notesToShow = allNotes.slice(startIndex, endIndex);
  const totalPages = Math.ceil(allNotes.length / PAGINATION_ITEMS_PER_PAGE);

  let html = '';

  if (allNotes.length === 0) {
    html += '<div class="loading">No notes found.</div>';
    return html;
  }

  html += '<div class="dashboard-grid">';

  for (const note of notesToShow) {
    let thumbnailHtml;

    if (note.thumbnail) {
      thumbnailHtml = `<img class="note-card-thumbnail" src="${note.thumbnail}" alt="${note.title}" loading="lazy">`;
    } else {
      thumbnailHtml = `
        <div class="note-card-thumbnail-placeholder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
        </div>
      `;
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

  return html;
}

export function goToPage(page) {
  currentPage = page;
  const html = renderDashboardPage(page);
  document.getElementById('app').innerHTML = html;
  window.scrollTo(0, 0);
}
