/**
 * Theme Service
 * Handles theme state and persistence
 */

import { setTheme, getTheme } from '../state/appState.js?v=1771259982340';

/**
 * Initializes the theme from local storage or default
 */
export function initThemeState() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    return savedTheme;
}

/**
 * Persists the theme to local storage
 * @param {string} theme 
 */
export function saveTheme(theme) {
    localStorage.setItem('theme', theme);
    setTheme(theme);
}

/**
 * Configures mermaid with the current theme
 * @param {string} theme 
 */
export function configureMermaid(theme) {
    if (typeof mermaid === 'undefined') return;

    const mermaidTheme = theme === 'dark' ? 'dark' : 'default';
    console.log('[ThemeService] Initializing mermaid with:', mermaidTheme);

    mermaid.initialize({
        startOnLoad: false,
        theme: mermaidTheme,
        securityLevel: 'loose',
        fontFamily: 'inherit',
        themeVariables: theme === 'dark' ? {
            primaryColor: '#30363d',
            primaryTextColor: '#e6edf3',
            primaryBorderColor: '#444c56',
            lineColor: '#8b949e',
            secondaryColor: '#21262d',
            tertiaryColor: '#161b22',
            background: 'transparent',
            mainBkg: 'transparent'
        } : {
            background: 'transparent',
            mainBkg: 'transparent'
        }
    });
}
