/**
 * Dashboard Service
 * Handles data fetching and filtering for the dashboard
 */

import { fetchFile } from '../core/fileApi.js?v=1771152601208';
import { setDashboardContent } from '../state/appState.js?v=1771152601208';

/**
 * Loads the dashboard markdown file
 */
export async function loadDashboardNotes() {
    console.log('[DashboardService] Initializing dashboard content...');

    try {
        const content = await fetchFile('_dashboard.md');
        setDashboardContent(content);
        console.log('[DashboardService] _dashboard.md loaded');
    } catch (error) {
        console.error('[DashboardService] Error loading _dashboard.md:', error);
        setDashboardContent('');
    }
}

/**
 * Filters dashboard sections based on query and active tags
 */
export function filterSections(sections, query, activeTags) {
    if (!query && (!activeTags || activeTags.length === 0)) {
        return sections.filter(section => section.notes.length > 0);
    }

    const lowerQuery = query ? query.toLowerCase() : '';
    const activeTagsSet = new Set(activeTags || []);

    return sections.map(section => {
        const filteredNotes = section.notes.filter(note => {
            // 1. Search Query Filter
            const matchesQuery = !lowerQuery ||
                note.title.toLowerCase().includes(lowerQuery) ||
                (note.description && note.description.toLowerCase().includes(lowerQuery));

            if (!matchesQuery) return false;

            // 2. Tag Filter (OR Logic)
            if (activeTags && activeTags.length > 0) {
                if (!note.tags || note.tags.length === 0) return false;
                const hasTag = note.tags.some(tag => activeTagsSet.has(tag));
                if (!hasTag) return false;
            }

            return true;
        });

        return {
            ...section,
            notes: filteredNotes,
            count: filteredNotes.length
        };
    }).filter(section => section.notes.length > 0);
}
