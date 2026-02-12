
export const IS_LOCAL = ['localhost', '127.0.0.1'].includes(window.location.hostname);
export const PAGINATION_ITEMS_PER_PAGE = 9;

export function getRawUrl(filename) {
  if (filename.startsWith('http')) return filename;

  let targetFile = filename;
  // Add .md extension if missing (and not an image or system file)
  if (!targetFile.includes('.') && !targetFile.startsWith('_image_')) {
    targetFile += '.md';
  }

  const encodedFilename = encodeURIComponent(targetFile);

  if (IS_LOCAL) {
    // Local 'serve' prefers simple filename
    return encodedFilename;
  } else {
    // GitHub Pages needs explicit relative path './'
    return `./${encodedFilename}`;
  }
}

const fileCache = new Map();

export async function fetchFile(filename) {
  // Return from cache if available
  if (fileCache.has(filename)) {
    console.log('[Fetch] Returning from cache:', filename);
    return fileCache.get(filename);
  }

  console.log('[Fetch] Requesting file:', filename);
  const url = getRawUrl(filename);

  try {
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const text = await response.text();
    fileCache.set(filename, text); // Cache the result
    return text;
  } catch (error) {
    console.error('[Fetch] Error:', error);
    throw error;
  }
}

/**
 * Prefetches a file and stores it in cache without returning it
 */
export function prefetchFile(filename) {
  if (fileCache.has(filename)) return;
  console.log('[Fetch] Prefetching:', filename);
  fetchFile(filename).catch(() => { }); // Fire and forget, error handled inside fetchFile
}

export function transformInternalLinks(html) {
  return html.replace(
    /\[\[(.*?)\]\]/g,
    (match, filename) => {
      const path = '/' + filename.replace(/\.md$/, '');
      return `<a href="#${path}" class="internal-link">${filename}</a>`;
    }
  );
}

export function transformObsidianImageLinks(markdown) {
  console.log('[Render] Converting Obsidian image links');

  return markdown.replace(
    /!\[\[(.*?)\]\]/g,
    (match, filename) => {
      const url = getRawUrl('_image_' + filename);
      return `![${filename}](${url})`;
    }
  );
}

export function parseFrontmatter(markdown) {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
  const match = markdown.match(frontmatterRegex);

  const result = {
    data: {},
    content: markdown
  };

  if (match) {
    const yamlContent = match[1];
    result.content = markdown.replace(frontmatterRegex, '').trim();

    const lines = yamlContent.split('\n');
    let currentKey = null;

    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      // Handle list items for the current key (e.g. tags)
      if (currentKey && (trimmedLine.startsWith('- ') || trimmedLine.startsWith('-'))) {
        if (Array.isArray(result.data[currentKey])) {
          let value = trimmedLine.replace(/^-/, '').trim();
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          // Remove '#' prefix from tags
          if (currentKey === 'tags') {
            value = value.replace(/^#/, '');
          }
          result.data[currentKey].push(value);
        }
        return;
      }

      // Parse key-value pairs
      const separatorIndex = line.indexOf(':');
      if (separatorIndex !== -1) {
        const key = line.substring(0, separatorIndex).trim();
        let value = line.substring(separatorIndex + 1).trim();

        currentKey = key;

        if (key === 'tags') {
          result.data[key] = result.data[key] || []; // Initialize as array

          // Case 1: Inline list [tag1, tag2]
          if (value.startsWith('[') && value.endsWith(']')) {
            value = value.slice(1, -1);
            const tags = value.split(',').map(t => {
              let tag = t.trim();
              if ((tag.startsWith('"') && tag.endsWith('"')) || (tag.startsWith("'") && tag.endsWith("'"))) {
                tag = tag.slice(1, -1);
              }
              return tag.replace(/^#/, '');
            }).filter(t => t);
            result.data[key] = [...result.data[key], ...tags];
            currentKey = null; // Reset current key as we're done with tags
          }
          // Case 2: Inline comma-separated value
          else if (value) {
            const tags = value.split(',').map(t => t.trim().replace(/^#/, '')).filter(t => t);
            // Only if there are actual values
            if (tags.length > 0) {
              result.data[key] = [...result.data[key], ...tags];
              currentKey = null;
            }
          }
          // Case 3: Empty value, implying subsequent lines have the list (handled in next iterations)
        } else {
          // Normal key-value
          let cleanValue = value;
          if ((cleanValue.startsWith('"') && cleanValue.endsWith('"')) || (cleanValue.startsWith("'") && cleanValue.endsWith("'"))) {
            cleanValue = cleanValue.slice(1, -1);
          }
          result.data[key] = cleanValue;
        }
      }
    });
  }

  // Extract inline tags from content: #tag but not # Heading
  // Skip code blocks (```...```) to be more accurate
  const contentForTags = result.content.replace(/```[\s\S]*?```/g, '');
  const inlineTagsMatch = contentForTags.matchAll(/(?:^|\s)#([^\s!@#$%^&*(),.?":{}|<>]+)/g);
  const inlineTags = Array.from(inlineTagsMatch).map(m => m[1]);

  // Merge and deduplicate tags
  const existingTags = result.data.tags || [];
  const allTags = [...new Set([...existingTags, ...inlineTags])];
  result.data.tags = allTags;

  return result;
}
