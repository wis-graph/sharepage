const fs = require('fs');
const path = require('path');
const core = require('./core-logic');

// Constants
const ROOT_DIR = path.join(__dirname, '..');
const TEMPLATE_PATH = path.join(ROOT_DIR, 'src', 'index.html');
const NOTES_DIR = path.join(ROOT_DIR, 'notes');
const POSTS_DIR = path.join(ROOT_DIR, 'posts');

// Dynamic Domain Detection
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY || 'wis-graph/sharepage';
const [owner, repo] = GITHUB_REPOSITORY.split('/');
const DOMAIN = repo.toLowerCase() === `${owner.toLowerCase()}.github.io`
    ? `https://${owner.toLowerCase()}.github.io`
    : `https://${owner.toLowerCase()}.github.io/${repo}`;

console.log(`[Rebuild] Target Domain: ${DOMAIN}`);

// Load Processors
const processors = {
    standard: require('./processors/standard'),
    youtube: require('./processors/youtube')
};

if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR);

/**
 * Generate Static HTML for a single markdown file (Forced)
 */
function generateStaticHtml(template, mdFilename) {
    const normalizedName = core.normalizeName(mdFilename.replace(/\.md$/, ''));
    const htmlPath = path.join(POSTS_DIR, `${normalizedName}.html`);
    const mdPath = path.join(NOTES_DIR, mdFilename);

    const content = fs.readFileSync(mdPath, 'utf8');
    const { data, body } = core.parseFrontmatter(content);

    const docType = (data.type || data.source_type || 'standard').toLowerCase();
    const processor = processors[docType] || processors.standard;

    const result = processor.process(data, body, mdFilename);
    const cleanName = encodeURIComponent(normalizedName);
    const pageUrl = `${DOMAIN}/posts/${cleanName}.html`;

    const staticHtml = core.applyMetadataToTemplate(template, {
        ...result,
        pageUrl
    }, DOMAIN);

    fs.writeFileSync(htmlPath, staticHtml);
    console.log(`[Rebuild] Forced Regen (${docType}): posts/${normalizedName}.html`);
}

/**
 * Rebuild All Logic
 */
function rebuildAll() {
    console.log('[Rebuild] Starting full reconstruction of all notes...');

    if (!fs.existsSync(TEMPLATE_PATH) || !fs.existsSync(NOTES_DIR)) {
        console.error('[Rebuild] Error: Essential files or directories missing');
        return;
    }

    const newVersion = `v=${Date.now()}`;
    let template = fs.readFileSync(TEMPLATE_PATH, 'utf8');

    // 1. Update version tags
    template = template.replace(/\?v=[^\s"']+/g, `?${newVersion}`);

    // 2. Generate/Update Root pages
    const dashboardHtml = core.applyMetadataToTemplate(template, {
        title: 'Dashboard',
        description: 'Personal Knowledge Hub',
        pageUrl: DOMAIN,
        ogImage: DOMAIN + '/images/logo.png',
        ogType: 'website'
    }, DOMAIN);
    fs.writeFileSync(path.join(ROOT_DIR, 'index.html'), dashboardHtml);
    fs.writeFileSync(path.join(ROOT_DIR, '404.html'), dashboardHtml);
    console.log(`[Rebuild] Updated system pages (index & 404)`);

    // 3. Update JS Versions (Global Cache Busting)
    const JS_DIR = path.join(ROOT_DIR, 'js');
    function updateJsVersions(dir) {
        if (!fs.existsSync(dir)) return;
        fs.readdirSync(dir).forEach(file => {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                updateJsVersions(fullPath);
            } else if (file.endsWith('.js')) {
                let content = fs.readFileSync(fullPath, 'utf8');
                content = content.replace(/\?v=[^\s"']+/g, `?${newVersion}`);
                fs.writeFileSync(fullPath, content);
            }
        });
    }
    updateJsVersions(JS_DIR);

    // 4. File Discovery
    const files = fs.readdirSync(NOTES_DIR);
    const mdFiles = files
        .filter(f => f.endsWith('.md') && !f.startsWith('_'))
        .map(f => ({
            name: f,
            time: fs.statSync(path.join(NOTES_DIR, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time)
        .map(f => f.name);

    // 5. Force Re-generate all post files
    mdFiles.forEach(file => generateStaticHtml(template, file));

    // 6. Cleanup Orphaned HTML files
    const existingHtmlFiles = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.html'));
    const expectedHtmlNames = new Set(mdFiles.map(f => core.normalizeName(f.replace(/\.md$/, ''))));

    existingHtmlFiles.forEach(htmlFile => {
        const nameWithoutExt = htmlFile.replace(/\.html$/, '');
        if (!expectedHtmlNames.has(core.normalizeName(nameWithoutExt))) {
            const orphanPath = path.join(POSTS_DIR, htmlFile);
            fs.unlinkSync(orphanPath);
            console.log(`[Rebuild] Cleaned orphan: posts/${htmlFile}`);
        }
    });

    // 7. Refresh Global File Index
    const indexData = JSON.stringify(mdFiles, null, 2);
    fs.writeFileSync(path.join(POSTS_DIR, 'file_index.json'), indexData);

    console.log(`[Rebuild] Success! ${mdFiles.length} notes fully reconstructed.`);
}

rebuildAll();
