/**
 * Preview View
 * Handles the UI for link hover previews (popups, positioning)
 */

import { getPreviewData } from '../services/previewService.js?v=1771152601208';

let previewTimeout = null;
let currentPreview = null;
let initialized = false;

/**
 * Initializes link hover previews using event delegation
 */
export function initLinkPreviews() {
    if (initialized) return;
    initialized = true;

    console.log('[PreviewView] Initializing link hover previews');

    document.addEventListener('mouseover', (e) => {
        const link = e.target.closest('.internal-link');
        if (!link) return;

        const href = link.getAttribute('href');
        if (!href || !href.startsWith('#/')) return;

        const targetPath = decodeURIComponent(href.slice(2));

        clearTimeout(previewTimeout);
        previewTimeout = setTimeout(() => {
            showPreview(targetPath, e.clientX, e.clientY);
        }, 400);
    });

    document.addEventListener('mouseout', (e) => {
        const link = e.target.closest('.internal-link');
        const relatedTarget = e.relatedTarget;
        const isMovingToPopup = relatedTarget && relatedTarget.closest('.link-preview-popup');

        if (link && !isMovingToPopup) {
            clearTimeout(previewTimeout);
            setTimeout(() => {
                if (!document.querySelector('.link-preview-popup:hover') && !document.querySelector('.internal-link:hover')) {
                    hidePreview();
                }
            }, 100);
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (!currentPreview) return;
        const isOverLink = e.target.closest('.internal-link');
        const isOverPopup = e.target.closest('.link-preview-popup');
        if (!isOverLink && !isOverPopup) {
            hidePreview();
        }
    });
}

/**
 * Shows the preview popup
 */
async function showPreview(targetPath, x, y) {
    if (currentPreview && currentPreview.dataset.path === targetPath) return;

    try {
        const { title, description, thumbnail } = await getPreviewData(targetPath);

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

        hidePreview();
        document.body.appendChild(popup);
        currentPreview = popup;

        positionPopup(popup, x, y);

        requestAnimationFrame(() => {
            popup.classList.add('is-visible');
        });

    } catch (error) {
        console.warn('[PreviewView] Failed to show preview for:', targetPath, error);
    }
}

/**
 * Positions the popup safely within the viewport
 */
function positionPopup(popup, x, y) {
    const rect = popup.getBoundingClientRect();
    let top = y + 20;
    let left = x + 10;

    if (left + rect.width > window.innerWidth) {
        left = window.innerWidth - rect.width - 20;
    }
    if (top + rect.height > window.innerHeight) {
        top = y - rect.height - 20;
    }

    popup.style.top = `${top}px`;
    popup.style.left = `${left}px`;
}

/**
 * Hides and removes the preview popup
 */
export function hidePreview() {
    if (currentPreview) {
        currentPreview.remove();
        currentPreview = null;
    }
}
