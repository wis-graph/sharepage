export function createTagTicker(tags) {
    if (!tags || tags.length === 0) return '';

    const tagsHtml = tags.map(tag => `
        <span class="tag-pill">
            #${tag.toLowerCase()}
        </span>
    `).join('');

    return `
        <div class="tag-pills-container">
            ${tagsHtml}
        </div>
    `;
}
