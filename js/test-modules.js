/**
 * Test file for new layered modules
 * This file tests the new modules without affecting existing code
 */

import { BASE_PATH, PATHS } from './core/config.js';
import { getNotePath, getNoteFile, parseNotePath, getRawUrl } from './services/pathService.js';

console.log('[Test] BASE_PATH:', BASE_PATH);
console.log('[Test] PATHS:', PATHS);
console.log('[Test] getNotePath("welcome"):', getNotePath('welcome'));
console.log('[Test] getNoteFile("welcome"):', getNoteFile('welcome'));
console.log('[Test] parseNotePath("/posts/welcome"):', parseNotePath('/posts/welcome'));
console.log('[Test] getRawUrl("_dashboard.md"):', getRawUrl('_dashboard.md'));
console.log('[Test] All new modules loaded successfully! ✅');
