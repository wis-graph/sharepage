/**
 * Application State
 * Centralized state management for the entire application
 */

// Dashboard State
const dashboardState = {
    dashboardContent: '',
    sections: [],
    allTags: [],
    searchQuery: '',
    activeTags: new Set(),
    currentPage: 1
};

// Document State
const documentState = {
    currentDocument: null,
    currentPath: null,
    scrollPosition: 0
};

// UI State
const uiState = {
    theme: 'light',
    tocVisible: true,
    sidebarCollapsed: false
};

/**
 * Dashboard State Getters/Setters
 */
export function getDashboardState() {
    return { ...dashboardState };
}

export function setDashboardContent(content) {
    dashboardState.dashboardContent = content;
}

export function getDashboardContent() {
    return dashboardState.dashboardContent;
}

export function setDashboardSections(sections) {
    dashboardState.sections = sections;
}

export function getDashboardSections() {
    return dashboardState.sections;
}

export function setAllTags(tags) {
    dashboardState.allTags = tags;
}

export function getAllTags() {
    return dashboardState.allTags;
}

export function setSearchQuery(query) {
    dashboardState.searchQuery = query;
}

export function getSearchQuery() {
    return dashboardState.searchQuery;
}

export function toggleTag(tag) {
    if (dashboardState.activeTags.has(tag)) {
        dashboardState.activeTags.delete(tag);
    } else {
        dashboardState.activeTags.add(tag);
    }
}

export function addActiveTag(tag) {
    dashboardState.activeTags.add(tag);
}

export function removeActiveTag(tag) {
    dashboardState.activeTags.delete(tag);
}

export function getActiveTags() {
    return Array.from(dashboardState.activeTags);
}

export function clearActiveTags() {
    dashboardState.activeTags.clear();
}

export function setCurrentPage(page) {
    dashboardState.currentPage = page;
}

export function getCurrentPage() {
    return dashboardState.currentPage;
}

/**
 * Document State Getters/Setters
 */
export function setCurrentDocument(doc) {
    documentState.currentDocument = doc;
}

export function getCurrentDocument() {
    return documentState.currentDocument;
}

export function setCurrentPath(path) {
    documentState.currentPath = path;
}

export function getCurrentPath() {
    return documentState.currentPath;
}

/**
 * UI State Getters/Setters
 */
export function setTheme(theme) {
    uiState.theme = theme;
}

export function getTheme() {
    return uiState.theme;
}

export function setTocVisible(visible) {
    uiState.tocVisible = visible;
}

export function isTocVisible() {
    return uiState.tocVisible;
}

/**
 * Reset all state (useful for testing)
 */
export function resetState() {
    dashboardState.dashboardContent = '';
    dashboardState.sections = [];
    dashboardState.searchQuery = '';
    dashboardState.activeTags.clear();
    dashboardState.currentPage = 1;

    documentState.currentDocument = null;
    documentState.currentPath = null;
    documentState.scrollPosition = 0;

    uiState.theme = 'light';
    uiState.tocVisible = true;
    uiState.sidebarCollapsed = false;
}
