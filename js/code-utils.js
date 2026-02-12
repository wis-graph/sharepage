/**
 * ShareHub Code Utilities Module
 * Handles copy-to-clipboard for code blocks and mermaid diagrams.
 */
import { openLightbox } from './image-viewer.js?v=32001';

export function initCodeUtils() {
    attachCodeCopyButtons();
    attachMermaidActions();
}

function attachCodeCopyButtons() {
    const codeBlocks = document.querySelectorAll('pre:not(.mermaid-pre)');

    codeBlocks.forEach(pre => {
        // Skip if already has a wrapper
        if (pre.parentElement.classList.contains('code-block-wrapper')) return;
        if (pre.querySelector('.mermaid')) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);

        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-button';
        copyBtn.textContent = 'Copy';

        copyBtn.addEventListener('click', async () => {
            const code = pre.textContent;
            try {
                await navigator.clipboard.writeText(code);
                copyBtn.textContent = 'Copied!';
                copyBtn.classList.add('copied');

                setTimeout(() => {
                    copyBtn.textContent = 'Copy';
                    copyBtn.classList.remove('copied');
                }, 2000);
            } catch (err) {
                console.error('Failed to copy!', err);
            }
        });

        wrapper.appendChild(copyBtn);
    });
}

function attachMermaidActions() {
    const mermaidContainers = document.querySelectorAll('.mermaid');

    mermaidContainers.forEach(container => {
        // Skip if already has actions
        if (container.parentElement.classList.contains('mermaid-wrapper')) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'mermaid-wrapper';
        container.parentNode.insertBefore(wrapper, container);
        wrapper.appendChild(container);

        const actionLayer = document.createElement('div');
        actionLayer.className = 'mermaid-actions';

        // 1. Copy Code Button
        const copyCodeBtn = document.createElement('button');
        copyCodeBtn.className = 'mermaid-btn';
        copyCodeBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
      Code
    `;
        copyCodeBtn.onclick = async () => {
            const code = container.getAttribute('data-code') || container.textContent;
            await navigator.clipboard.writeText(code);
            const originalText = copyCodeBtn.innerHTML;
            copyCodeBtn.textContent = 'Copied!';
            setTimeout(() => copyCodeBtn.innerHTML = originalText, 2000);
        };

        // 2. Copy Image (PNG) Button
        const copyImgBtn = document.createElement('button');
        copyImgBtn.className = 'mermaid-btn';
        copyImgBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
      Image
    `;
        copyImgBtn.onclick = () => saveMermaidAsImage(container, copyImgBtn);

        actionLayer.appendChild(copyCodeBtn);
        actionLayer.appendChild(copyImgBtn);
        wrapper.appendChild(actionLayer);

        // Zoom Behavior for Mermaid
        wrapper.addEventListener('click', (e) => {
            // Only zoom if not clicking a button
            if (e.target.closest('.mermaid-btn')) return;

            const svg = container.querySelector('svg');
            if (svg) {
                const xml = new XMLSerializer().serializeToString(svg);
                const svg64 = btoa(unescape(encodeURIComponent(xml)));
                const src = 'data:image/svg+xml;base64,' + svg64;
                openLightbox(src, true);
            }
        });
    });
}

function saveMermaidAsImage(container, btn) {
    const svg = container.querySelector('svg');
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const bbox = svg.getBBox();
    const padding = 20;

    canvas.width = bbox.width + padding * 2;
    canvas.height = bbox.height + padding * 2;

    const ctx = canvas.getContext('2d');
    const xml = new XMLSerializer().serializeToString(svg);
    const svg64 = btoa(unescape(encodeURIComponent(xml)));
    const b64Start = 'data:image/svg+xml;base64,';
    const image64 = b64Start + svg64;

    const img = new Image();
    img.onload = () => {
        ctx.fillStyle = 'white'; // White background for the image
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, padding, padding);

        canvas.toBlob(blob => {
            const originalHTML = btn.innerHTML;
            try {
                const item = new ClipboardItem({ "image/png": blob });
                navigator.clipboard.write([item]);

                // Visual feedback instead of alert
                btn.textContent = 'Copied!';
                setTimeout(() => btn.innerHTML = originalHTML, 2000);
            } catch (err) {
                // Fallback: Download
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'mermaid-diagram.png';
                a.click();

                btn.textContent = 'Downloaded!';
                setTimeout(() => btn.innerHTML = originalHTML, 2000);
            }
        });
    };
    img.src = image64;
}
