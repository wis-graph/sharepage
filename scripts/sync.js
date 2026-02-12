const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const TEMPLATE_PATH = path.join(ROOT_DIR, 'index.html');

/**
 * Basic Frontmatter Parser
 */
function parseFrontmatter(content) {
    const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
    const match = content.match(frontmatterRegex);
    const data = {};
    let body = content;

    if (match) {
        body = content.replace(frontmatterRegex, '').trim();
        const yaml = match[1];
        yaml.split('\n').forEach(line => {
            const parts = line.split(':');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join(':').trim().replace(/^['"](.*)['"]$/, '$1');
                data[key] = value;
            }
        });
    }

    return { data, body };
}

/**
 * Generate Static HTML for a markdown file
 */
function generateStaticHtml(template, mdFilename) {
    const fullPath = path.join(ROOT_DIR, mdFilename);
    const content = fs.readFileSync(fullPath, 'utf8');
    const { data, body } = parseFrontmatter(content);

    const title = data.title || mdFilename.replace(/\.md$/, '');
    let description = data.description || data.summary || '';

    if (!description) {
        // Extract first 150 chars from body
        description = body.replace(/[#*`_\[\]]/g, '').trim().substring(0, 150).replace(/\n/g, ' ') + '...';
    }

    // Handle thumbnail
    let ogImage = '';
    // The app logic for images is:
    // if starts with http -> use as is
    // else -> encodeURIComponent(_image_ + filename)
    if (data.thumbnail) {
        if (data.thumbnail.startsWith('http')) {
            ogImage = data.thumbnail;
        } else {
            ogImage = `_image_${data.thumbnail}`;
        }
    } else {
        // Try to find first image in body
        const imageMatch = content.match(/!\[\[([^\]]+)\]\]/) || content.match(/!\[.*?\]\((.*?)\)/);
        if (imageMatch) {
            // Note: the regex might capture things that aren't images, but it's a good heuristic
            const rawUrl = imageMatch[1] || imageMatch[2];
            if (rawUrl) {
                ogImage = rawUrl.startsWith('http') ? rawUrl : `_image_${rawUrl}`;
            }
        }
    }

    // Replace Meta Tags in Template
    let html = template;

    // Update Title
    html = html.replace(/<title>.*?<\/title>/, `<title>${title} - SharePage</title>`);
    html = html.replace(/<meta property="og:title" content=".*?">/, `<meta property="og:title" content="${title}">`);

    // Update Description
    html = html.replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${description}">`);
    html = html.replace(/<meta property="og:description" content=".*?">/, `<meta property="og:description" content="${description}">`);

    // Update Image
    if (ogImage) {
        // Encode it for safety if it's a local file ref
        const finalImage = ogImage.startsWith('http') ? ogImage : encodeURIComponent(ogImage);
        html = html.replace(/<meta property="og:image" content=".*?">/, `<meta property="og:image" content="${finalImage}">`);
    }

    const outputFilename = mdFilename.replace(/\.md$/, '.html');
    fs.writeFileSync(path.join(ROOT_DIR, outputFilename), html);
    console.log(`[Sync] Generated: ${outputFilename}`);
}

/**
 * Main Sync Logic
 */
function sync() {
    console.log('[Sync] Starting pre-rendering for SEO/OG support...');

    if (!fs.existsSync(TEMPLATE_PATH)) {
        console.error('[Sync] Error: index.html not found');
        return;
    }

    const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
    const files = fs.readdirSync(ROOT_DIR);

    const mdFiles = files.filter(f =>
        f.endsWith('.md') &&
        !f.startsWith('_') &&
        f !== 'task.md' &&
        f !== 'todo.md' &&
        f !== 'README.md'
    );

    mdFiles.forEach(file => {
        generateStaticHtml(template, file);
    });

    console.log(`[Sync] Completed. Generated ${mdFiles.length} HTML files.`);
}

sync();
