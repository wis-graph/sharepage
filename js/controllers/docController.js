/**
 * Document Controller
 * Coordinates document loading, processing, and rendering
 */

import { fetchFile } from '../core/fileApi.js?v=1771152428920';
import { processDocument } from '../services/docService.js?v=1771152428920';
import { renderDocumentView, renderError, renderLoading, prepareLayout } from '../views/docView.js?v=1771152428920';
import { initImageViewer } from '../views/imageViewer.js?v=1771152428920';
import { initCodeUtils } from '../views/codeView.js?v=1771152428920';
import { initLinkPreviews } from '../views/previewView.js?v=1771152428920';
import { renderTOC, initScrollHighlight } from '../views/tocView.js?v=1771152428920';
import { initScrollAnimations, cleanupScrollAnimations, initDashboardAnimations } from '../views/animations.js?v=1771152428920';
import { loadDashboardNotes } from '../services/dashboardService.js?v=1771152428920';
import { renderDashboardPage } from '../views/dashboardView.js?v=1771152428920';

/**
 * Handles individual document route logic
 * @param {string} filename 
 */
export async function handleDocumentRoute(filename) {
    prepareLayout({ isDashboard: false });
    renderLoading('Loading Content');
    document.title = `${filename} - SharePage`;
    console.log('[DocController] Loading document:', filename);

    try {
        // Normalize filename to NFC for consistent fetching (important for Korean on different OS)
        const normalizedFilename = filename.normalize('NFC');
        const rawContent = await fetchFile(normalizedFilename);

        // Process content (Service Layer)
        const processedDoc = await processDocument(normalizedFilename, rawContent);

        // Render View (View Layer)
        renderDocumentView(
            processedDoc.title,
            processedDoc.tags,
            processedDoc.html,
            processedDoc.metadata
        );

        // Post-render initializations
        await initPostRenderScripts();

    } catch (error) {
        renderError(filename, error);
    }
}

/**
 * Handles the dashboard route logic
 */
export async function handleDashboardRoute() {
    prepareLayout({ isDashboard: true });
    renderLoading('Loading Dashboard');
    document.title = 'Dashboard - SharePage';
    console.log('[DocController] Loading dashboard');

    try {
        await loadDashboardNotes();
        const html = await renderDashboardPage(1);

        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = html;
            window.scrollTo(0, 0);
            initDashboardAnimations();
        }
    } catch (error) {
        renderError('Dashboard', error);
    }
}

/**
 * Initializes utilities that need the DOM to be ready
 */
async function initPostRenderScripts() {
    initImageViewer();
    initCodeUtils();
    initLinkPreviews();

    // Initialize Mermaid
    const mermaidElements = document.querySelectorAll('.mermaid');
    if (mermaidElements.length > 0 && typeof mermaid !== 'undefined') {
        try {
            await mermaid.run({ querySelector: '.mermaid' });
            console.log('[DocController] Mermaid rendered');
        } catch (e) {
            console.warn('[DocController] Mermaid error:', e);
        }
    }

    // Initialize TOC
    renderTOC();
    initScrollHighlight();

    // Initialize scroll animations
    initScrollAnimations();

    console.log('[DocController] Content fully rendered');
}
