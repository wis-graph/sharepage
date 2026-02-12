const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const TEMPLATE_PATH = path.join(ROOT_DIR, 'index.html');
const NOTES_DIR = path.join(ROOT_DIR, 'notes');
const POSTS_DIR = path.join(ROOT_DIR, 'posts');
const IMAGES_DIR = path.join(ROOT_DIR, 'images');

if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR);

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
    const fullPath = path.join(NOTES_DIR, mdFilename);
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
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;

    // Logic for picking a thumbnail
    const rawThumbnail = data.thumbnail || data.url || '';

    if (rawThumbnail) {
        const ytMatch = rawThumbnail.match(youtubeRegex);
        if (ytMatch && ytMatch[1]) {
            ogImage = `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
        } else if (rawThumbnail.startsWith('http')) {
            ogImage = rawThumbnail;
        } else {
            ogImage = `images/${rawThumbnail}`;
        }
    }

    if (!ogImage) {
        // Strip code blocks to avoid false positives
        const contentCleaned = body
            .replace(/```[\s\S]*?```/g, '')
            .replace(/`[^`]*`/g, '');

        // Try to find first image or video link in body
        const imageMatch = contentCleaned.match(/!\[\[([^\]]+)\]\]/) || contentCleaned.match(/!\[.*?\]\((.*?)\)/);
        if (imageMatch) {
            const rawUrl = imageMatch[1] || imageMatch[2];
            if (rawUrl) {
                const ytMatch = rawUrl.match(youtubeRegex);
                if (ytMatch && ytMatch[1]) {
                    ogImage = `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
                } else {
                    ogImage = rawUrl.startsWith('http') ? rawUrl : `images/${rawUrl}`;
                }
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
        // OG Image MUST be absolute URL for Kakaotalk/Facebook etc.
        const DOMAIN = 'https://wis-graph.github.io/sharepage'; // TODO: Make configurable

        let finalImage = ogImage.startsWith('http') ? ogImage : ogImage.split('/').map(p => encodeURIComponent(p)).join('/');

        if (!finalImage.startsWith('http')) {
            // Remove leading slash if present to avoid double slash with domain
            if (finalImage.startsWith('/')) finalImage = finalImage.substring(1);
            finalImage = `${DOMAIN}/${finalImage}`;
        }

        html = html.replace(/<meta property="og:image" content=".*?">/, `<meta property="og:image" content="${finalImage}">`);
    }

    const outputFilename = mdFilename.replace(/\.md$/, '.html');
    fs.writeFileSync(path.join(POSTS_DIR, outputFilename), html);
    console.log(`[Sync] Generated: posts/${outputFilename}`);
}

/**
 * Main Sync Logic
 */
function sync() {
    console.log('[Sync] Starting pre-rendering (Structured Mode)...');

    if (!fs.existsSync(TEMPLATE_PATH)) {
        console.error('[Sync] Error: index.html not found');
        return;
    }

    if (!fs.existsSync(NOTES_DIR)) {
        console.error('[Sync] Error: notes/ directory not found');
        return;
    }

    const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
    const files = fs.readdirSync(NOTES_DIR);

    const mdFiles = files.filter(f =>
        f.endsWith('.md') &&
        !f.startsWith('_')
    );

    mdFiles.forEach(file => {
        generateStaticHtml(template, file);
    });

    // Generate file index for auto-dashboard
    const indexData = JSON.stringify(mdFiles, null, 2);
    fs.writeFileSync(path.join(POSTS_DIR, 'file_index.json'), indexData);
    console.log(`[Sync] Generated file_index.json with ${mdFiles.length} entries.`);

    console.log(`[Sync] Completed. Generated ${mdFiles.length} HTML files into posts/ directory.`);
}

sync();
