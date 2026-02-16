/**
 * Theme Controller
 * Handles theme-related UI updates and user interactions
 */

import { getTheme } from '../state/appState.js?v=1771261308121';
import { initThemeState, saveTheme, configureMermaid } from '../services/themeService.js?v=1771261308121';
import { applyThemeToBody, updateThemeIcon } from '../views/themeView.js?v=1771261308121';

/**
 * Initializes the theme UI and state
 */
export function initTheme() {
    const theme = initThemeState();
    applyThemeToBody(theme);
    updateThemeIcon(theme);
    configureMermaid(theme);
}

/**
 * Toggles the theme between light and dark
 */
export function toggleTheme() {
    const currentTheme = getTheme();
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';

    saveTheme(nextTheme);
    applyThemeToBody(nextTheme);
    updateThemeIcon(nextTheme);
    configureMermaid(nextTheme);

    console.log('[ThemeController] Switched to', nextTheme);

    // If mermaid diagrams exist, reload to re-render them (simplest consistent way)
    const mermaidElements = document.querySelectorAll('.mermaid');
    if (mermaidElements.length > 0) {
        location.reload();
    }
}
