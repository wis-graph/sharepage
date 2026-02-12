/**
 * ShareHub Image Viewer Module
 * Handles image background blur wrapping and click-to-zoom modal with wheel support.
 */

let currentScale = 1;
let isDragging = false;
let startX, startY, moveX = 0, moveY = 0;

export function initImageViewer() {
    const images = document.querySelectorAll('.markdown img');
    images.forEach(img => {
        // Only wrap if not already wrapped
        if (!img.parentElement.classList.contains('image-wrapper')) {
            wrapImage(img);
        }

        img.parentElement.addEventListener('click', (e) => {
            openLightbox(img.src);
        });
    });
}

function wrapImage(img) {
    const wrapper = document.createElement('div');
    wrapper.className = 'image-wrapper';

    const blurBg = document.createElement('div');
    blurBg.className = 'image-blur-bg';
    blurBg.style.backgroundImage = `url(${img.src})`;

    img.parentNode.insertBefore(wrapper, img);
    wrapper.appendChild(blurBg);
    wrapper.appendChild(img);
}

export function openLightbox(src, isDiagram = false) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('image-viewer-modal');
    if (!modal) {
        modal = createModal();
    }

    const modalImg = modal.querySelector('img');
    modalImg.src = src;
    modalImg.style.transform = 'scale(1) translate(0px, 0px)';

    if (isDiagram) {
        modalImg.classList.add('is-diagram');
    } else {
        modalImg.classList.remove('is-diagram');
    }

    currentScale = 1;
    moveX = 0;
    moveY = 0;

    modal.classList.add('open');
    document.body.style.overflow = 'hidden'; // Stop page scroll

    // Close event - Escape key
    const handleEsc = (e) => {
        if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleEsc);
    modal._handleEsc = handleEsc;
}


function createModal() {
    const modal = document.createElement('div');
    modal.id = 'image-viewer-modal';
    modal.className = 'image-viewer-modal';

    const container = document.createElement('div');
    container.className = 'image-viewer-container';

    const img = document.createElement('img');
    img.draggable = false;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'image-viewer-close';
    closeBtn.innerHTML = '&times;';

    const hint = document.createElement('div');
    hint.className = 'image-viewer-hint';
    hint.textContent = 'Cmd/Ctrl + Scroll to zoom • Two fingers to pan';

    container.appendChild(img);
    modal.appendChild(container);
    modal.appendChild(closeBtn);
    modal.appendChild(hint);
    document.body.appendChild(modal);

    // Event: Close
    closeBtn.onclick = closeModal;
    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };

    // Event: Zoom (Wheel) & Pan (Trackpad)
    container.addEventListener('wheel', (e) => {
        e.preventDefault();

        if (e.ctrlKey || e.metaKey) {
            // Zoom
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            const newScale = Math.min(Math.max(currentScale + delta, 0.5), 5);
            currentScale = Number(newScale.toFixed(2));
        } else {
            // Pan (Trackpad or Mouse Wheel)
            moveX -= e.deltaX;
            moveY -= e.deltaY;
        }
        updateTransform(img);
    }, { passive: false });

    // Event: Pan (Drag - Mouse)
    container.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX - moveX;
        startY = e.clientY - moveY;
        container.style.cursor = 'grabbing';
    });

    // We attach these to window but need to manage cleanup to avoid leaks if valid
    // For simplicity in this module context, we attach to window and rely on isDragging flag
    // A better approach for SPA is to attach/detach on open/close.

    return modal;
}

// ... helper to attach/detach global listeners
const handleDragMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    moveX = e.clientX - startX;
    moveY = e.clientY - startY;
    const modal = document.getElementById('image-viewer-modal');
    if (modal) {
        const img = modal.querySelector('img');
        if (img) updateTransform(img);
    }
};

const handleDragEnd = () => {
    isDragging = false;
    const modal = document.getElementById('image-viewer-modal');
    if (modal) {
        const container = modal.querySelector('.image-viewer-container');
        if (container) container.style.cursor = 'grab';
    }
};

// Initialize listeners once
window.addEventListener('mousemove', handleDragMove);
window.addEventListener('mouseup', handleDragEnd);
