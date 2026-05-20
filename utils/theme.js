// utils/theme.js — Theme detection and application

let _mediaQuery = null;

export function applyTheme(root, theme) {
  if (!root) return;

  if (_mediaQuery) {
    _mediaQuery.removeEventListener('change', _mediaQuery._handler);
    _mediaQuery = null;
  }

  if (theme === 'auto') {
    _mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = (e) => root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    _mediaQuery._handler = apply;
    _mediaQuery.addEventListener('change', apply);
    apply(_mediaQuery);
  } else {
    root.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
  }
}
