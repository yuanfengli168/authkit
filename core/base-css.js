// core/base-css.js — Shared base CSS variables for AuthKit components
// Injected once via injectStyles('base', ...) — duplicate calls are no-ops.

import { injectStyles } from '../utils/dom.js';

const BASE_CSS = `
[data-authkit] {
  --ak-color-primary: #4F46E5;
  --ak-color-primary-hover: #4338CA;
  --ak-color-primary-text: #FFFFFF;
  --ak-color-bg: #FFFFFF;
  --ak-color-bg-subtle: #F9FAFB;
  --ak-color-surface: #FFFFFF;
  --ak-color-border: #E5E7EB;
  --ak-color-text: #111827;
  --ak-color-text-secondary: #6B7280;
  --ak-color-error: #DC2626;
  --ak-color-error-bg: #FEF2F2;
  --ak-color-success: #16A34A;
  --ak-overlay-bg: rgba(0,0,0,0.5);
  --ak-font-family: system-ui,-apple-system,'Segoe UI',sans-serif;
  --ak-font-size-base: 16px;
  --ak-font-size-sm: 14px;
  --ak-font-size-lg: 18px;
  --ak-spacing-xs: 4px;
  --ak-spacing-sm: 8px;
  --ak-spacing-md: 16px;
  --ak-spacing-lg: 24px;
  --ak-spacing-xl: 32px;
  --ak-radius-sm: 4px;
  --ak-radius-md: 8px;
  --ak-radius-lg: 12px;
  --ak-radius-full: 9999px;
  --ak-modal-width: 400px;
  --ak-modal-shadow: 0 20px 60px rgba(0,0,0,0.15);
  --ak-btn-height: 44px;
  --ak-btn-font-weight: 500;
  --ak-btn-radius: var(--ak-radius-md);
  --ak-z-overlay: 1000;
  --ak-z-modal: 1001;
  box-sizing: border-box;
  font-family: var(--ak-font-family);
  font-size: var(--ak-font-size-base);
}
[data-authkit] *, [data-authkit] *::before, [data-authkit] *::after { box-sizing: inherit; }
[data-authkit][data-theme="dark"] {
  --ak-color-bg: #1F2937;
  --ak-color-bg-subtle: #111827;
  --ak-color-surface: #374151;
  --ak-color-border: #4B5563;
  --ak-color-text: #F9FAFB;
  --ak-color-text-secondary: #9CA3AF;
  --ak-overlay-bg: rgba(0,0,0,0.7);
}
[data-authkit] .ak-hidden { display: none !important; }
`;

/**
 * Ensure base AuthKit CSS variables are injected into the document.
 * Safe to call multiple times — injectStyles deduplicates by ID.
 */
export function ensureBaseCSS() {
  injectStyles('base', BASE_CSS);
}

export { BASE_CSS };