const fs = require('fs');
const path = require('path');
const core = require('./core-logic');
const classifier = require('./classifier');

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

console.log(`[Sync] Target Domain: ${DOMAIN}`);

// Load Processors
const processors = {
    standard: require('./processors/standard'),
    youtube: require('./processors/youtube')
};

if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR);

/**
 * Generate Static HTML for a single markdown file (Incremental)
 */
function generateStaticHtml(template, mdFilename) {
    const normalizedName = core.normalizeName(mdFilename.replace(/\.md$/, ''));
    const htmlPath = path.join(POSTS_DIR, `${normalizedName}.html`);
    const mdPath = path.join(NOTES_DIR, mdFilename);

    // Skip if HTML already exists and is newer than Markdown
    if (fs.existsSync(htmlPath)) {
        const mdStat = fs.statSync(mdPath);
        const htmlStat = fs.statSync(htmlPath);
        if (htmlStat.mtime > mdStat.mtime) {
            return; // Skip build
        }
    }

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
    console.log(`[Sync] Generated (${docType}): posts/${normalizedName}.html`);
}

/**
 * Inject metatags and title into template using placeholders
 */
function applyMetadataToTemplate(template, metadata) {
    return core.applyMetadataToTemplate(template, metadata, DOMAIN);
}

/**
 * Main Sync Logic (GitHub Action Runner)
 */
function sync() {
    console.log('[Sync] Starting runner (Incremental Mode)...');

    if (!fs.existsSync(TEMPLATE_PATH) || !fs.existsSync(NOTES_DIR)) {
        console.error('[Sync] Error: Essential files or directories missing');
        return;
    }

    const newVersion = `v=${Date.now()}`;
    let template = fs.readFileSync(TEMPLATE_PATH, 'utf8');

    // 1. Update version tags in HTML template
    template = template.replace(/\?v=[^\s"']+/g, `?${newVersion}`);

    // 2. Generate/Update Root index.html and 404.html (System Global)
    const dashboardHtml = applyMetadataToTemplate(template, {
        title: 'Dashboard',
        description: 'Personal Knowledge Hub',
        pageUrl: DOMAIN,
        ogImage: DOMAIN + '/images/logo.png',
        ogType: 'website'
    });
    fs.writeFileSync(path.join(ROOT_DIR, 'index.html'), dashboardHtml);
    fs.writeFileSync(path.join(ROOT_DIR, '404.html'), dashboardHtml);
    console.log(`[Sync] Updated system pages (index & 404)`);

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
                const originalContent = content;
                content = content.replace(/\?v=[^\s"']+/g, `?${newVersion}`);
                if (content !== originalContent) {
                    fs.writeFileSync(fullPath, content);
                    console.log(`[Sync] Bumped: js/.../${file}`);
                }
            }
        });
    }
    updateJsVersions(JS_DIR);

    // 4. File Discovery and Sorting
    const files = fs.readdirSync(NOTES_DIR);
    const mdFiles = files
        .filter(f => f.endsWith('.md') && !f.startsWith('_'))
        .map(f => ({
            name: f,
            time: fs.statSync(path.join(NOTES_DIR, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time)
        .map(f => f.name);

    // 5. Dashboard Maintenance (Sanity Check)
    const DASHBOARD_PATH = path.join(NOTES_DIR, '_dashboard.md');
    if (fs.existsSync(DASHBOARD_PATH)) {
        let dashboardContent = fs.readFileSync(DASHBOARD_PATH, 'utf8');
        const validFileNames = new Set(mdFiles.map(f => core.normalizeName(f.replace(/\.md$/, ''))));

        // Remove dead links & Auto-add unlinked (Housekeeping)
        let updatedContent = dashboardContent;
        const today = new Date().toISOString().split('T')[0];

        mdFiles.forEach(name => {
            const fullPath = path.join(NOTES_DIR, name);
            const content = fs.readFileSync(fullPath, 'utf8');
            const { data } = core.parseFrontmatter(content);

            // Use the classification engine
            const targetSection = classifier.classify(data);

            updatedContent = core.updateDashboardContent(updatedContent, name, today, true, targetSection);
        });

        // Final sanity check for removed files
        let finalLines = updatedContent.split('\n').filter(line => {
            const linkMatch = line.match(/\[\[([^\]]+)\]\]/);
            if (linkMatch) {
                let link = linkMatch[1].split('|')[0].trim().replace(/\.md$/, '');
                return validFileNames.has(core.normalizeName(link));
            }
            return true;
        });

        fs.writeFileSync(DASHBOARD_PATH, finalLines.join('\n'));
    }

    // 6. Incremental Static HTML Generation
    mdFiles.forEach(file => generateStaticHtml(template, file));

    // 7. Cleanup Orphaned HTML files
    const existingHtmlFiles = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.html'));
    const expectedHtmlNames = new Set(mdFiles.map(f => core.normalizeName(f.replace(/\.md$/, ''))));

    existingHtmlFiles.forEach(htmlFile => {
        const nameWithoutExt = htmlFile.replace(/\.html$/, '');
        if (!expectedHtmlNames.has(core.normalizeName(nameWithoutExt))) {
            const orphanPath = path.join(POSTS_DIR, htmlFile);
            fs.unlinkSync(orphanPath);
            console.log(`[Sync] Cleaned orphan: posts/${htmlFile}`);
        }
    });

    // 8. Generate Global File Index (Registry)
    const indexData = JSON.stringify(mdFiles, null, 2);
    fs.writeFileSync(path.join(POSTS_DIR, 'file_index.json'), indexData);

    console.log(`[Sync] Completed. ${mdFiles.length} notes managed.`);
}

sync();
