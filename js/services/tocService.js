/**
 * TOC Service
 * Handles heading extraction and ID generation for Table of Contents
 */

import { slugify } from './markdownService.js?v=1771260300867';

/**
 * Adds IDs to headings in HTML and wraps them for anchor linking
 * @param {string} html 
 * @returns {string} Processed HTML
 */
export function addHeadingIds(html) {
    console.log('[TOCService] Adding heading IDs and anchors');
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const headings = doc.querySelectorAll('h1, h2, h3, h4');
    const idCounts = {};

    headings.forEach((heading) => {
        const text = heading.textContent;
        let id = slugify(text);

        // Ensure unique ID
        if (idCounts[id]) {
            idCounts[id]++;
            id = `${id}-${idCounts[id]}`;
        } else {
            idCounts[id] = 1;
        }

        heading.id = id;

        const wrapper = document.createElement('div');
        wrapper.className = 'markdown-heading-wrapper';
        const anchor = document.createElement('a');
        anchor.href = '#' + id;
        anchor.className = 'heading-anchor';
        anchor.innerHTML = '#';
        wrapper.appendChild(anchor);

        heading.parentNode.insertBefore(wrapper, heading);
        wrapper.appendChild(heading);
    });

    return doc.body.innerHTML;
}

/**
 * Extracts TOC data from the current document
 * @returns {Array} Array of heading objects
 */
export function extractTOC() {
    const tocItems = [];
    const headings = document.querySelectorAll('.document-container h1, h2, h3, h4');

    headings.forEach((heading) => {
        const level = parseInt(heading.tagName[1]);
        const text = heading.textContent;
        const id = heading.id;

        tocItems.push({ level, text, id });
    });

    return tocItems;
}
