import { navigate, initRouter } from './router.js?v=16000';
import { BASE_PATH, IS_LOCAL } from './utils.js?v=16000';
import { initTOCToggle } from './toc.js?v=16000';
import { goToPage } from './dashboard.js?v=16000';

// Expose goToPage to global scope for pagination
window.goToPage = goToPage;

function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.body.className = savedTheme === 'dark' ? 'theme-dark' : '';
  updateThemeIcon(savedTheme);
  initMermaid(savedTheme);
}

function initMermaid(appTheme) {
  if (typeof mermaid === 'undefined') return;
  const mermaidTheme = appTheme === 'dark' ? 'dark' : 'default';
  console.log('[Mermaid] Initializing with theme:', mermaidTheme);
  mermaid.initialize({
    startOnLoad: false,
    theme: mermaidTheme,
    securityLevel: 'loose',
    fontFamily: 'inherit',
    themeVariables: appTheme === 'dark' ? {
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

function updateThemeIcon(theme) {
  const icon = document.getElementById('theme-icon');
  if (theme === 'dark') {
    icon.innerHTML = `
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    `;
  } else {
    icon.innerHTML = `
      <circle cx="12" cy="12" r="5"></circle>
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>
    `;
  }
}

async function toggleTheme() {
  const isDark = document.body.classList.toggle('theme-dark');
  const theme = isDark ? 'dark' : 'light';
  localStorage.setItem('theme', theme);
  updateThemeIcon(theme);
  console.log('[Theme] Switched to', theme);

  // Re-initialize mermaid with new theme
  initMermaid(theme);

  // Force re-render of existing diagrams if any
  const mermaidElements = document.querySelectorAll('.mermaid');
  if (mermaidElements.length > 0) {
    console.log('[Theme] Re-rendering mermaid diagrams for', theme, 'mode');
    // Note: We might need to restore original code before re-running mermaid.run
    // But since mermaid.run usually works on the container text, we'll try:
    location.reload(); // Simplest way to ensure all JS components (Mermaid, KaTeX) re-render correctly with new theme
  }
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('[App] Initializing history-based routing...');

  if (typeof hljs === 'undefined') {
    console.error('[App] Error: highlight.js is not loaded');
    document.getElementById('app').innerHTML = '<div class="error">Error: highlight.js failed to load. Please refresh the page.</div>';
    return;
  }

  initTheme();
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

  initRouter();
  initTOCToggle();

  // Update logo link with BASE_PATH
  const logo = document.querySelector('.navbar-logo');
  if (logo) {
    logo.href = (BASE_PATH || '') + '/';
  }

  // Initial navigation based on current path
  const path = window.location.pathname;
  const hash = window.location.hash;

  if (hash.startsWith('#/')) {
    // Redirect old hash links to paths
    const newPath = hash.slice(1);
    history.replaceState(null, '', newPath);
    navigate(newPath);
  } else {
    navigate(path);
  }
});

export { initTheme, updateThemeIcon, toggleTheme };
