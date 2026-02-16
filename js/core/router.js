/**
 * Router - Navigation and Route Handling
 * Core routing logic only. Delegates to controllers for specific routes.
 */

import { BASE_PATH } from './config.js?v=1771259473751';
import { parseNotePath } from '../services/pathService.js?v=1771259473751';
import { handleDashboardRoute, handleDocumentRoute } from '../controllers/docController.js?v=1771259473751';

/**
 * Main navigation entry point
 * @param {string} rawPath - The URL path (e.g. /sharepage/posts/My-Note)
 */
export async function navigate(rawPath) {
  console.log('[Router] Navigating to:', rawPath);

  // 1. Detect and fix malformed paths
  if (BASE_PATH && rawPath.includes(BASE_PATH + BASE_PATH)) {
    const correctPath = rawPath.replace(BASE_PATH + BASE_PATH, BASE_PATH);
    history.replaceState(null, '', correctPath);
    return navigate(correctPath);
  }

  // 2. Extract hash for later usage
  const hashIdx = rawPath.indexOf('#');
  const hash = hashIdx !== -1 ? rawPath.slice(hashIdx) : '';
  const pathWithoutHash = hashIdx !== -1 ? rawPath.slice(0, hashIdx) : rawPath;

  // 3. Normalize path and route
  const normalizedPath = normalizePath(pathWithoutHash);

  if (normalizedPath === '' || normalizedPath === '/') {
    await handleDashboardRoute();
  } else {
    const noteName = parseNotePath(normalizedPath);
    if (noteName) {
      await handleDocumentRoute(noteName);
    } else {
      await handleLegacyRedirect(normalizedPath);
    }
  }

  // 4. Scroll to hash if present after content is rendered
  if (hash) {
    setTimeout(() => scrollToElement(hash.slice(1)), 100);
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

  if (!path.startsWith('/')) path = '/' + path;
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  if (path.endsWith('.html')) path = path.slice(0, -5);

  return path;
}

/**
 * Scrolls to an element by ID with sticky header offset
 */
function scrollToElement(id) {
  const element = document.getElementById(id);
  if (element) {
    const yOffset = -85; // Account for fixed header
    const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
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

    // Handle internal path links (starting with /, # or same origin)
    if (href.startsWith('/') || href.startsWith('#') || href.startsWith(window.location.origin)) {
      const url = new URL(href, window.location.origin);

      // Don't intercept if it's an external link
      if (url.origin !== window.location.origin) return;

      e.preventDefault();

      // Case 1: Same-page anchor link (#heading)
      if (href.startsWith('#')) {
        scrollToElement(href.slice(1));
        history.pushState(null, '', window.location.pathname + window.location.search + href);
        return;
      }

      // Case 2: Standard or cross-page heading link
      const fullPath = url.pathname + url.search + url.hash;
      if (window.location.pathname + window.location.search + window.location.hash === fullPath) return;

      history.pushState(null, '', fullPath);

      if (document.startViewTransition) {
        document.startViewTransition(() => navigate(fullPath));
      } else {
        navigate(fullPath);
      }

      if (!url.hash) {
        window.scrollTo(0, 0);
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
