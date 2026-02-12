import { fetchFile, parseFrontmatter, getRawUrl } from './utils.js?v=24000';

let previewTimeout = null;
let currentPreview = null;
let initialized = false;

/**
 * Initializes link hover previews using event delegation
 */
export function initLinkPreviews() {
    if (initialized) return;
    initialized = true;

    console.log('[Preview] Initializing link hover previews');

    document.addEventListener('mouseover', (e) => {
        const link = e.target.closest('.internal-link');
        if (!link) return;

        const href = link.getAttribute('href');
        if (!href || !href.startsWith('#/')) return;

        const targetPath = decodeURIComponent(href.slice(2));

        clearTimeout(previewTimeout);
        previewTimeout = setTimeout(() => {
            showPreview(targetPath, e.clientX, e.clientY);
        }, 400); // 400ms delay to prevent accidental popups
    });

    document.addEventListener('mouseout', (e) => {
        const link = e.target.closest('.internal-link');
        const relatedTarget = e.relatedTarget;
        const isMovingToPopup = relatedTarget && relatedTarget.closest('.link-preview-popup');

        if (link && !isMovingToPopup) {
            clearTimeout(previewTimeout);
            // Small delay before hiding to allow moving into popup
            setTimeout(() => {
                if (!document.querySelector('.link-preview-popup:hover') && !document.querySelector('.internal-link:hover')) {
                    hidePreview();
                }
            }, 100);
        }
    });

    // Global mousemove to catch edge cases
    document.addEventListener('mousemove', (e) => {
        if (!currentPreview) return;

        const isOverLink = e.target.closest('.internal-link');
        const isOverPopup = e.target.closest('.link-preview-popup');

        if (!isOverLink && !isOverPopup) {
            // Check if we are still somewhat close to the popup or link to avoid jitter
            // For simplicity, just hide if not over either
            hidePreview();
        }
    });
}

/**
 * Shows the preview popup for a given note path
 */
async function showPreview(targetPath, x, y) {
    // Don't show if already showing the same path
    if (currentPreview && currentPreview.dataset.path === targetPath) return;

    try {
        const rawContent = await fetchFile(targetPath);
        const { data, content } = parseFrontmatter(rawContent);

        // Extract basic metadata
        const title = data.title || targetPath.replace(/\.md$/, '');
        let description = data.description || data.summary || '';

        if (!description) {
            // Basic markdown clean up for preview snippet
            const plainText = content
                .replace(/!\[\[.*?\]\]/g, '') // remove obsidian images
                .replace(/!\[.*?\]\(.*?\)/g, '') // remove markdown images
                .replace(/[#*`_\[\]]/g, '') // remove markdown syntax
                .trim();
            description = plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');
        }

        // Try to find a thumbnail
        let thumbnail = data.thumbnail ? getRawUrl('_image_' + data.thumbnail) : null;
        if (!thumbnail) {
            const obsidianMatch = rawContent.match(/!\[\[([^\]]+)\]\]/);
            if (obsidianMatch) {
                thumbnail = getRawUrl('_image_' + obsidianMatch[1]);
            }
        }

        // Create popup element
        const popup = document.createElement('div');
        popup.className = 'link-preview-popup';
        popup.dataset.path = targetPath;

        popup.innerHTML = `
      ${thumbnail ? `<img src="${thumbnail}" class="preview-thumbnail" />` : ''}
      <div class="preview-content">
        <div class="preview-title">${title}</div>
        <div class="preview-description">${description}</div>
      </div>
    `;

        // Remove existing if any
        hidePreview();

        document.body.appendChild(popup);
        currentPreview = popup;

        // Smart positioning
        const rect = popup.getBoundingClientRect();
        let top = y + 20;
        let left = x + 10;

        // Screen boundary checks
        if (left + rect.width > window.innerWidth) {
            left = window.innerWidth - rect.width - 20;
        }
        if (top + rect.height > window.innerHeight) {
            top = y - rect.height - 20;
        }

        popup.style.top = `${top}px`;
        popup.style.left = `${left}px`;

        // Trigger transition
        requestAnimationFrame(() => {
            popup.classList.add('is-visible');
        });

    } catch (error) {
        console.warn('[Preview] Failed to fetch preview content for:', targetPath, error);
    }
}

/**
 * Hides and removes the preview popup
 */
function hidePreview() {
    if (currentPreview) {
        currentPreview.remove();
        currentPreview = null;
    }
}
