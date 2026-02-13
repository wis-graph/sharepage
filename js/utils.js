/**
 * Utils - Backward Compatibility Layer
 * 
 * This file re-exports functions from the new layered architecture.
 * It exists solely for backward compatibility with code that hasn't been migrated yet.
 * 
 * TODO: Gradually migrate all imports to use the new modules directly:
 * - core/config.js - Configuration constants
 * - core/fileApi.js - File fetching and caching
 * - services/pathService.js - Path management
 * - services/markdownService.js - Markdown transformation
 */

// ============================================================
// Re-exports from core/config.js
// ============================================================
export { IS_LOCAL, BASE_PATH, PATHS, PAGINATION } from './core/config.js';

// Backward compatibility: PAGINATION_ITEMS_PER_PAGE
import { PAGINATION } from './core/config.js';
export const PAGINATION_ITEMS_PER_PAGE = PAGINATION.ITEMS_PER_PAGE;

// ============================================================
// Re-exports from core/fileApi.js
// ============================================================
export { fetchFile, prefetchFile, clearCache, getCacheStats } from './core/fileApi.js';

// ============================================================
// Re-exports from services/pathService.js
// ============================================================
export { getNotePath, getNoteFile, parseNotePath, getRawUrl } from './services/pathService.js';

// ============================================================
// Re-exports from services/markdownService.js
// ============================================================
export {
  slugify,
  transformInternalLinks,
  transformObsidianImageLinks,
  parseFrontmatter
} from './services/markdownService.js';
