const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const TEMPLATE_PATH = path.join(ROOT_DIR, 'index.html');
const NOTES_DIR = path.join(ROOT_DIR, 'notes');
const POSTS_DIR = path.join(ROOT_DIR, 'posts');
const IMAGES_DIR = path.join(ROOT_DIR, 'images');
const DOMAIN = 'https://wis-graph.github.io/sharepage';

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
 * Clean and normalize text for metadata (description)
 */
function cleanMetadataText(text) {
    if (!text) return '';
    return text
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/__(.+?)__/g, '$1')
        .replace(/_(.+?)_/g, '$1')
        .replace(/~~(.+?)~~/g, '$1')
        .replace(/`(.+?)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
        .replace(/[#*`_\[\]]/g, '')
        .replace(/\n/g, ' ')
        .trim();
}

/**
 * Get description from frontmatter or body
 */
function extractDescription(data, body) {
    let description = data.description || data.summary || '';
    if (!description) {
        description = cleanMetadataText(body).substring(0, 150) + '...';
    } else {
        description = cleanMetadataText(description);
    }
    return description;
}

/**
 * Extract Open Graph image (Thumbnail)
 */
function extractOgImage(data, body) {
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;

    // 1. Try from Frontmatter
    let thumbnail = data.thumbnail || data.url || '';

    // Filter out placeholder strings
    const placeholders = ['(입력된 URL 없음)', '없음', '(없음)', 'n/a', 'none'];
    if (thumbnail && placeholders.some(p => thumbnail.toLowerCase().includes(p.toLowerCase()))) {
        thumbnail = '';
    }

    if (thumbnail) {
        if (thumbnail.startsWith('[[') && thumbnail.endsWith(']]')) {
            thumbnail = thumbnail.slice(2, -2);
        }

        const ytMatch = thumbnail.match(youtubeRegex);
        if (ytMatch && ytMatch[1]) {
            return `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
        }
        if (thumbnail.startsWith('http')) {
            return thumbnail;
        }
        return `images/${thumbnail}`;
    }

    // 2. Try from Body (Images/Videos)
    const contentCleaned = body.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '');
    const imageMatch = contentCleaned.match(/!\[\[([^\]]+)\]\]/) || contentCleaned.match(/!\[.*?\]\((.*?)\)/);

    if (imageMatch) {
        const rawUrl = imageMatch[1];
        const ytMatch = rawUrl.match(youtubeRegex);
        if (ytMatch && ytMatch[1]) {
            return `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
        }
        return rawUrl.startsWith('http') ? rawUrl : `images/${rawUrl}`;
    }

    // 3. Fallback for YouTube Source
    const docType = (data.type || data.source_type || '').toLowerCase();
    if (docType === 'youtube') {
        const anyYtMatch = body.match(youtubeRegex);
        if (anyYtMatch && anyYtMatch[1]) {
            return `https://img.youtube.com/vi/${anyYtMatch[1]}/maxresdefault.jpg`;
        }
    }

    return '';
}

/**
 * Inject metatags and title into template
 */
function applyMetadataToTemplate(template, metadata) {
    let html = template;
    const { title, description, pageUrl, finalOgImage, isVideo } = metadata;

    html = html.replace(/<title>.*?<\/title>/, `<title>${title} - SharePage</title>`);
    html = html.replace(/<meta property="og:title" content=".*?">/, `<meta property="og:title" content="${title}">`);
    html = html.replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${description}">`);
    html = html.replace(/<meta property="og:description" content=".*?">/, `<meta property="og:description" content="${description}">`);
    html = html.replace(/<meta property="og:url" content=".*?">/, `<meta property="og:url" content="${pageUrl}">`);

    if (finalOgImage) {
        html = html.replace(/<meta property="og:image" content=".*?">/, `<meta property="og:image" content="${finalOgImage}">`);
        if (isVideo) {
            html = html.replace(/<meta property="og:type" content="website">/, `<meta property="og:type" content="video.other">`);
        }
    }

    return html;
}

/**
 * Fix relative paths for resources (Removed as <base> tag handles this)
 */
function fixResourcePaths(html) {
    return html;
}

/**
 * Generate Static HTML for a single markdown file
 */
function generateStaticHtml(template, mdFilename) {
    const fullPath = path.join(NOTES_DIR, mdFilename);
    const content = fs.readFileSync(fullPath, 'utf8');
    const { data, body } = parseFrontmatter(content);

    const title = data.title || mdFilename.replace(/\.md$/, '');
    const description = extractDescription(data, body);
    const ogImage = extractOgImage(data, body);

    // Prepare Absolute URLs for OG
    const urlSlug = mdFilename.replace(/\.md$/, '');
    const pageUrl = `${DOMAIN}/posts/${encodeURIComponent(urlSlug)}`;

    let finalOgImage = '';
    if (ogImage) {
        finalOgImage = ogImage.startsWith('http') ? ogImage : ogImage.split('/').map(p => encodeURIComponent(p)).join('/');
        if (!finalOgImage.startsWith('http')) {
            if (finalOgImage.startsWith('/')) finalOgImage = finalOgImage.substring(1);
            finalOgImage = `${DOMAIN}/${finalOgImage}`;
        }
    }

    let staticHtml = applyMetadataToTemplate(template, {
        title,
        description,
        pageUrl,
        finalOgImage,
        isVideo: ogImage.includes('youtube.com/vi/')
    });

    staticHtml = fixResourcePaths(staticHtml);

    const fileName = mdFilename.replace(/\.md$/, '.html');
    const RESERVED = ['file_index.html'];
    if (RESERVED.includes(fileName)) return;

    fs.writeFileSync(path.join(POSTS_DIR, fileName), staticHtml);
    console.log(`[Sync] Generated: posts/${fileName}`);
}

/**
 * Main Sync Logic
 */
function sync() {
    console.log('[Sync] Starting pre-rendering (Structured Mode)...');

    if (!fs.existsSync(TEMPLATE_PATH) || !fs.existsSync(NOTES_DIR)) {
        console.error('[Sync] Error: Essential files or directories missing');
        return;
    }

    // 1. Generate new version string (Cache Busting)
    const newVersion = `v=${Date.now()}`;
    let template = fs.readFileSync(TEMPLATE_PATH, 'utf8');

    // 2. Update version in index.html for next time and consistency
    template = template.replace(/\?v=\d+/g, `?${newVersion}`);
    fs.writeFileSync(TEMPLATE_PATH, template);
    console.log(`[Sync] Updated index.html with version: ${newVersion}`);

    // 3. Generate 404.html from updated index.html (Point 1 of Audit)
    const path404 = path.join(ROOT_DIR, '404.html');
    fs.writeFileSync(path404, template);
    console.log(`[Sync] Synchronized 404.html from index.html`);

    // 4. Generate Post files
    const files = fs.readdirSync(NOTES_DIR);
    const mdFiles = files.filter(f => f.endsWith('.md') && !f.startsWith('_'));

    mdFiles.forEach(file => {
        generateStaticHtml(template, file);
    });

    const indexData = JSON.stringify(mdFiles, null, 2);
    fs.writeFileSync(path.join(POSTS_DIR, 'file_index.json'), indexData);
    console.log(`[Sync] Completed. Generated ${mdFiles.length} HTML files.`);
}

sync();
