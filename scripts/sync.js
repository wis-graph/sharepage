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

console.log(`[Sync] Target Domain: ${DOMAIN}`);

// Load Processors
const processors = {
    standard: require('./processors/standard'),
    youtube: require('./processors/youtube')
};

if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR);

/**
 * Generate Static HTML for a single markdown file
 */
function generateStaticHtml(template, mdFilename) {
    const fullPath = path.join(NOTES_DIR, mdFilename);
    const content = fs.readFileSync(fullPath, 'utf8');
    const { data, body } = core.parseFrontmatter(content);

    // Select processor based on frontmatter type
    const docType = (data.type || data.source_type || 'standard').toLowerCase();
    const processor = processors[docType] || processors.standard;

    // Process metadata
    const result = processor.process(data, body, mdFilename);
    const normalizedName = core.normalizeName(mdFilename.replace(/\.md$/, ''));
    const cleanName = encodeURIComponent(normalizedName);
    const pageUrl = `${DOMAIN}/posts/${cleanName}.html`;

    // Apply to template
    const staticHtml = core.applyMetadataToTemplate(template, {
        ...result,
        pageUrl
    }, DOMAIN);

    const fileName = `${normalizedName}.html`;
    fs.writeFileSync(path.join(POSTS_DIR, fileName), staticHtml);
    console.log(`[Sync] Generated (${docType}): posts/${fileName}`);
}



/**
 * Inject metatags and title into template using placeholders
 */
function applyMetadataToTemplate(template, metadata) {
    return core.applyMetadataToTemplate(template, metadata, DOMAIN);
}

/**
 * Main Sync Logic
 */
function sync() {
    console.log('[Sync] Starting pre-rendering (Modular Mode)...');

    if (!fs.existsSync(TEMPLATE_PATH) || !fs.existsSync(NOTES_DIR)) {
        console.error('[Sync] Error: Essential files or directories missing');
        return;
    }

    const newVersion = `v=${Date.now()}`;
    let template = fs.readFileSync(TEMPLATE_PATH, 'utf8');

    // 1. Update version in template
    template = template.replace(/\?v=[^\s"']+/g, `?${newVersion}`);

    // 2. Generate root index.html with Dashboard defaults
    const dashboardHtml = applyMetadataToTemplate(template, {
        title: 'Dashboard',
        description: 'Share your Obsidian notes with the world using SharePage.',
        pageUrl: DOMAIN,
        ogImage: DOMAIN + '/images/logo.png',
        ogType: 'website'
    });
    fs.writeFileSync(path.join(ROOT_DIR, 'index.html'), dashboardHtml);
    console.log(`[Sync] Updated root index.html`);

    // 3. Generate 404.html
    fs.writeFileSync(path.join(ROOT_DIR, '404.html'), dashboardHtml);
    console.log(`[Sync] Synchronized 404.html`);

    // 4. Update versions in all JS files (Recursive)
    const JS_DIR = path.join(ROOT_DIR, 'js');
    function updateJsVersions(dir) {
        if (!fs.existsSync(dir)) return;
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                updateJsVersions(fullPath);
            } else if (file.endsWith('.js')) {
                let content = fs.readFileSync(fullPath, 'utf8');
                const originalContent = content;
                content = content.replace(/\?v=[^\s"']+/g, `?${newVersion}`);
                if (content !== originalContent) {
                    fs.writeFileSync(fullPath, content);
                    console.log(`[Sync] Bumped version in: js/.../${file}`);
                }
            }
        });
    }
    updateJsVersions(JS_DIR);

    // 5. Generate file list (Sorted by mtime descending - Newest first)
    const files = fs.readdirSync(NOTES_DIR);
    const mdFiles = files
        .filter(f => f.endsWith('.md') && !f.startsWith('_'))
        .map(f => ({
            name: f,
            time: fs.statSync(path.join(NOTES_DIR, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time)
        .map(f => f.name);

    // 6. Automatic Dashboard Link Management
    const DASHBOARD_PATH = path.join(NOTES_DIR, '_dashboard.md');
    if (fs.existsSync(DASHBOARD_PATH)) {
        let dashboardContent = fs.readFileSync(DASHBOARD_PATH, 'utf8');
        let currentLines = dashboardContent.split('\n');

        // Find existing links and valid files
        const existingLinks = new Set();
        const validFileNames = new Set(mdFiles.map(f => core.normalizeName(f.replace(/\.md$/, ''))));

        dashboardContent.match(/\[\[([^\]]+)\]\]/g)?.forEach(match => {
            let link = match.slice(2, -2);
            if (link.includes('|')) link = link.split('|')[0];
            existingLinks.add(core.normalizeName(link.trim().replace(/\.md$/, '')));
        });

        // Identify and remove dead links from the lines
        const deadLinks = Array.from(existingLinks).filter(link => !validFileNames.has(link));
        if (deadLinks.length > 0) {
            console.log(`[Sync] Found ${deadLinks.length} dead links. Cleaning up: ${deadLinks.join(', ')}`);
            currentLines = currentLines.filter(line => {
                const linkMatch = line.match(/\[\[([^\]]+)\]\]/);
                if (linkMatch) {
                    let link = linkMatch[1];
                    if (link.includes('|')) link = link.split('|')[0];
                    const cleanLink = core.normalizeName(link.trim().replace(/\.md$/, ''));
                    return !deadLinks.includes(cleanLink);
                }
                return true;
            });
        }

        const newLinks = Array.from(validFileNames).filter(name => !existingLinks.has(name));

        if (newLinks.length > 0) {
            console.log(`[Sync] Found ${newLinks.length} unlinked files. Adding to Inbox...`);

            const today = new Date().toISOString().split('T')[0];
            newLinks.forEach(name => {
                dashboardContent = core.updateDashboardContent(dashboardContent, name, today, true);
            });
            currentLines = dashboardContent.split('\n');
        }

        if (deadLinks.length > 0 || newLinks.length > 0) {
            fs.writeFileSync(DASHBOARD_PATH, currentLines.join('\n'));
            console.log(`[Sync] Updated _dashboard.md (Inbox: +${newLinks.length}, Dead: -${deadLinks.length}).`);
        }
    }

    // 7. Generate post files
    mdFiles.forEach(file => {
        generateStaticHtml(template, file);
    });

    const indexData = JSON.stringify(mdFiles, null, 2);
    fs.writeFileSync(path.join(POSTS_DIR, 'file_index.json'), indexData);
    console.log(`[Sync] Completed. ${mdFiles.length} files processed (Sorted by date).`);
}

sync();
