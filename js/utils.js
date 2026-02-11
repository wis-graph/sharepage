export const github = {
  owner: 'wis-graph',
  repo: 'sharepage',
  branch: 'gh-pages'
};

export const PAGINATION_ITEMS_PER_PAGE = 9;

export const routes = {
  '/': {
    title: 'Home',
    file: '_home.md'
  },
  '/note-welcome': {
    title: 'Welcome',
    file: 'note-welcome.md'
  },
  '/note-todo': {
    title: 'Todo',
    file: 'note-todo.md'
  }
};

export function getRawUrl(filename) {
  return `https://raw.githubusercontent.com/${github.owner}/${github.repo}/${github.branch}/${filename}`;
}

export async function fetchFile(filename) {
  console.log('[Fetch] Fetching:', filename);
  const url = getRawUrl(filename);
  console.log('[Fetch] URL:', url);

  try {
    const response = await fetch(url);
    console.log('[Fetch] Response status:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const text = await response.text();
    console.log('[Fetch] Content length:', text.length);
    return text;
  } catch (error) {
    console.error('[Fetch] Error:', error);
    throw error;
  }
}

export function convertInternalLinks(html) {
  return html.replace(
    /\[\[(.*?)\]\]/g,
    (match, filename) => {
      const path = '/' + filename.replace(/\.md$/, '');
      return `<a href="#${path}" class="internal-link">${filename}</a>`;
    }
  );
}

export function convertImageLinks(markdown) {
  console.log('[Render] Converting image links');

  return markdown.replace(
    /!\[\[(.*?)\]\]/g,
    (match, filename) => {
      const url = getRawUrl('_image_' + filename);
      return `![${filename}](${url})`;
    }
  );
}
