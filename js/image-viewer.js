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
    hint.textContent = 'Wheel to zoom • Drag to pan';

    container.appendChild(img);
    modal.appendChild(container);
    modal.appendChild(closeBtn);
    modal.appendChild(hint);
    document.body.appendChild(modal);

    // Event: Close
    closeBtn.onclick = closeModal;
    modal.onclick = (e) => {
        if (e.target === modal || e.target === container) closeModal();
    };

    // Event: Zoom (Wheel)
    container.onwheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.2 : 0.2;
        const newScale = Math.min(Math.max(currentScale + delta, 0.5), 10);
        currentScale = newScale;
        updateTransform(img);
    };

    // Event: Pan (Drag)
    container.onmousedown = (e) => {
        isDragging = true;
        startX = e.clientX - moveX;
        startY = e.clientY - moveY;
        container.style.cursor = 'grabbing';
    };

    window.onmousemove = (e) => {
        if (!isDragging) return;
        moveX = e.clientX - startX;
        moveY = e.clientY - startY;
        updateTransform(img);
    };

    window.onmouseup = () => {
        isDragging = false;
        if (container) container.style.cursor = 'grab';
    };

    return modal;
}

function updateTransform(img) {
    img.style.transform = `translate(${moveX}px, ${moveY}px) scale(${currentScale})`;
}

function closeModal() {
    const modal = document.getElementById('image-viewer-modal');
    if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
        window.removeEventListener('keydown', modal._handleEsc);
    }
}
