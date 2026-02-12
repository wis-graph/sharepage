export function createTagTicker(tags) {
    if (!tags || tags.length === 0) return '';

    // If tags are too few, repeat them to ensure a seamless loop
    const displayTags = [...tags];
    while (displayTags.length < 15) {
        displayTags.push(...tags);
    }

    const tagsHtml = displayTags.map(tag => `
        <span class="ticker-tag">
            <span class="ticker-dot"></span>
            ${tag.toUpperCase()}
        </span>
    `).join('');

    return `
        <div class="tag-ticker-container">
            <div class="tag-ticker-track">
                ${tagsHtml}
            </div>
            <div class="tag-ticker-track" aria-hidden="true">
                ${tagsHtml}
            </div>
        </div>
    `;
}
