/**
 * Router - Navigation and Route Handling
 * Core routing logic only. Delegates to controllers for specific routes.
 */

import { BASE_PATH } from './config.js?v=1771233053537';
import { parseNotePath } from '../services/pathService.js?v=1771233053537';
import { handleDashboardRoute, handleDocumentRoute } from '../controllers/docController.js?v=1771233053537';

/**
 * Main navigation entry point
 * @param {string} rawPath - The URL path (e.g. /sharepage/posts/My-Note)
 */
export async function navigate(rawPath) {
  console.log('[Router] Navigating to:', rawPath, '(Base:', BASE_PATH, ')');

  // 1. Detect and fix malformed paths with duplicate BASE_PATH
  if (BASE_PATH && rawPath.includes(BASE_PATH + BASE_PATH)) {
    const correctPath = rawPath.replace(BASE_PATH + BASE_PATH, BASE_PATH);
    console.warn(`[Router] Malformed path detected: ${rawPath}, redirecting to ${correctPath}`);
    history.replaceState(null, '', correctPath);
    return navigate(correctPath);
  }

  // 2. Normalize path
  const normalizedPath = normalizePath(rawPath);

  // 3. Routing logic
  if (normalizedPath === '' || normalizedPath === '/') {
    await handleDashboardRoute();
  } else {
    // Use centralized path parser
    const noteName = parseNotePath(normalizedPath);

    if (noteName) {
      await handleDocumentRoute(noteName);
    } else {
      await handleLegacyRedirect(normalizedPath);
    }
  }
}

/**
 * Normalizes the raw path by removing BASE_PATH and cleanup
 */
function normalizePath(rawPath) {
  let path = rawPath;
  if (BASE_PATH && path.startsWith(BASE_PATH)) {
    path = path.slice(BASE_PATH.length);
  }

  // Ensure path starts with /
  if (!path.startsWith('/')) path = '/' + path;

  // Strip trailing slashes
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }

  // Strip .html extension
  if (path.endsWith('.html')) {
    path = path.slice(0, -5);
  }

  return path;
}

/**
 * Handles redirection for legacy URLs (/welcome -> /posts/welcome)
 */
async function handleLegacyRedirect(normalizedPath) {
  const filename = decodeURIComponent(normalizedPath.slice(1));
  const webFriendlyName = filename.replace(/ /g, '_');
  const newPath = (BASE_PATH || '') + '/posts/' + webFriendlyName;

  console.log(`[Router] Redirecting legacy path ${normalizedPath} to ${newPath}`);

  // Replace current history entry with new path
  history.replaceState(null, '', newPath);

  // Navigate to new path logic
  await handleDocumentRoute(filename);
}

/**
 * Global click interceptor for internal links
 */
export function initRouter() {
  document.body.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;

    // Handle internal path links (starting with / or same origin)
    if (href.startsWith('/') || href.startsWith(window.location.origin)) {
      const url = new URL(href, window.location.origin);

      // Don't intercept if it's an external link or has a different origin
      if (url.origin !== window.location.origin) return;

      e.preventDefault();

      let path = url.pathname;

      // Ensure path includes BASE_PATH if we are navigating internally
      if (BASE_PATH && !path.startsWith(BASE_PATH)) {
        path = BASE_PATH + (path.startsWith('/') ? '' : '/') + path;
      }

      if (window.location.pathname === path) return;

      history.pushState(null, '', path);

      if (document.startViewTransition) {
        document.startViewTransition(() => navigate(path));
      } else {
        navigate(path);
      }
    }
    // Handle old hash links for backward compatibility
    else if (href.startsWith('#/')) {
      e.preventDefault();
      const path = href.slice(1);
      history.pushState(null, '', path);
      navigate(path);
    }
  });

  window.addEventListener('popstate', () => {
    navigate(window.location.pathname);
  });
}
