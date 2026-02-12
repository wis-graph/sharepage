export const PAGINATION_ITEMS_PER_PAGE = 9;

export function getRawUrl(filename) {
  if (filename.startsWith('http')) return filename;

  let targetFile = filename;
  // Add .md extension if missing (and not an image or system file)
  if (!targetFile.includes('.') && !targetFile.startsWith('_image_')) {
    targetFile += '.md';
  }

  const encodedFilename = encodeURIComponent(targetFile);

  // Use a simple relative path. 
  // 'serve' usually serves the current directory as root.
  return `${encodedFilename}`;
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
          result.data[key] = []; // Initialize as array

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
            result.data[key] = tags;
            currentKey = null; // Reset current key as we're done with tags
          }
          // Case 2: Inline comma-separated value
          else if (value) {
            const tags = value.split(',').map(t => t.trim().replace(/^#/, '')).filter(t => t);
            // Only if there are actual values
            if (tags.length > 0) {
              result.data[key] = tags;
              currentKey = null;
            }
          }
          // Case 3: Empty value, implying subsequent lines have the list (handled in next iterations)
        } else {
          // Normal key-value
          result.data[key] = value;
        }
      }
    });
  }

  return result;
}
