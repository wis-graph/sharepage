/**
 * Path Service - Standalone path management
 * This is a NEW module that can be used independently
 * Existing code in utils.js is NOT affected
 */

// Import config (self-contained)
import { BASE_PATH, PATHS } from '../core/config.js';

/**
 * Get the SPA route path for a note
 */
export function getNotePath(noteName) {
    const cleanName = noteName.replace(/\.md$/, '');
    return (BASE_PATH || '') + '/' + PATHS.NOTE_PREFIX + '/' + cleanName;
}

/**
 * Get the markdown file path for a note
 */
export function getNoteFile(noteName) {
    const cleanName = noteName.replace(/\.md$/, '');
    return PATHS.NOTES_DIR + '/' + cleanName + '.md';
}

/**
 * Parse a URL path to extract the note name
 */
export function parseNotePath(urlPath) {
    let path = urlPath;
    if (BASE_PATH && path.startsWith(BASE_PATH)) {
        path = path.slice(BASE_PATH.length);
    }

    if (path.startsWith('/')) path = path.slice(1);
    if (path.endsWith('.html')) path = path.slice(0, -5);

    if (path.startsWith(PATHS.NOTE_PREFIX + '/')) {
        // Decode the path to handle Korean/special characters
        const noteName = path.slice(PATHS.NOTE_PREFIX.length + 1);
        return decodeURIComponent(noteName);
    }

    return null;
}

/**
 * Get raw URL for a resource
 */
export function getRawUrl(filename) {
    if (filename.startsWith('http')) return filename;

    let targetFile = filename;

    if (targetFile.startsWith('_image_')) {
        targetFile = PATHS.IMAGES_DIR + '/' + targetFile.replace('_image_', '');
    } else if (!targetFile.includes('/') && !targetFile.endsWith('.css') && !targetFile.endsWith('.js')) {
        if (!targetFile.endsWith('.md')) targetFile += '.md';
        targetFile = PATHS.NOTES_DIR + '/' + targetFile;
    }

    const encodedFilename = targetFile.split('/').map(part => encodeURIComponent(part)).join('/');
    return (BASE_PATH || '') + '/' + encodedFilename;
}
