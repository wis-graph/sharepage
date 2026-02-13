/**
 * Renderer - Backward Compatibility Layer
 * Re-exports from services/renderService.js
 */

export {
  normalizeMermaidAliases,
  protectMath,
  restoreMath,
  applySyntaxHighlighting,
  renderMermaidDiagrams,
  transformYouTubeLinks
} from './services/renderService.js?v=41000';

// renderMath is legacy
import { restoreMath } from './services/renderService.js?v=41000';
export function renderMath(html) {
  return restoreMath(html);
}
