import { navigate } from './router.js?v=4600';
import { initTOCToggle } from './toc.js?v=4600';
import { goToPage } from './dashboard.js?v=4600';

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

function handleHashChange() {
  const hash = window.location.hash.slice(1) || '/';
  console.log('[Router] Hash changed:', hash);
  window.scrollTo(0, 0);
  navigate(hash);
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('[App] Initializing...');

  console.log('[App] marked.js loaded:', typeof marked !== 'undefined');
  console.log('[App] highlight.js loaded:', typeof hljs !== 'undefined');
  console.log('[App] mermaid loaded:', typeof mermaid !== 'undefined');
  console.log('[App] katex loaded:', typeof katex !== 'undefined');

  if (typeof hljs === 'undefined') {
    console.error('[App] Error: highlight.js is not loaded');
    document.getElementById('app').innerHTML = '<div class="error">Error: highlight.js failed to load. Please refresh the page.</div>';
    return;
  }

  // Initial mermaid setup will be called by initTheme()

  initTheme();
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

  initTOCToggle();

  handleHashChange();
});

window.addEventListener('hashchange', handleHashChange);

export { initTheme, updateThemeIcon, toggleTheme };
