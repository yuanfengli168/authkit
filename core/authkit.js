// core/authkit.js — AuthKit public facade / singleton

import { dispatch, subscribe, getState } from './state.js';
import { initSession, getAuth_, getApp_ } from './session.js';
import { loadAll, registerProvider as _registerProvider, listLoaded } from './registry.js';
import { applyTheme }  from '../utils/theme.js';
import { injectStyles } from '../utils/dom.js';
import { setPostLoginRedirect, getPostLoginRedirect } from '../utils/redirect.js';

// ── Base CSS (injected once) ──────────────────────────────────────────────────
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

// ── Config defaults ───────────────────────────────────────────────────────────
const DEFAULTS = {
  enabledProviders: ['google', 'email'],
  loginMode:        'modal',
  googleAuthMode:   'popup',
  ui: {
    mode:      'modal',
    theme:     'auto',
    brandName: '',
    logoUrl:   null,
  },
  redirects: {
    afterLogin:  null,
    afterLogout: '/',
    loginPage:   '/login.html',
  },
  settings: {
    enableSavedKeys:      true,
    firestoreCollection:  'users',
  },
};

function mergeConfig(user, defaults) {
  const merged = { ...defaults };
  for (const key of Object.keys(user)) {
    if (user[key] !== null && typeof user[key] === 'object' && !Array.isArray(user[key])) {
      merged[key] = { ...(defaults[key] ?? {}), ...user[key] };
    } else {
      merged[key] = user[key];
    }
  }
  return merged;
}

// ── Internal state ────────────────────────────────────────────────────────────
let _config     = null;
let _modal      = null;
let _inline     = null;
let _providers  = [];
let _baseUrl    = '.';

// ── AuthKit singleton ─────────────────────────────────────────────────────────
export const AuthKit = {

  async init(userConfig) {
    // Validate required fields
    if (!userConfig?.firebase) throw new Error('[AuthKit] config.firebase is required.');
    if (!userConfig?.anchor)   throw new Error('[AuthKit] config.anchor is required (CSS selector or element).');

    _config = mergeConfig(userConfig, DEFAULTS);

    // Base URL for provider dynamic imports
    _baseUrl = userConfig.baseUrl ?? _inferBaseUrl();

    // Inject base styles
    injectStyles('base', BASE_CSS);

    // Find anchor element
    const anchor = typeof _config.anchor === 'string'
      ? document.querySelector(_config.anchor)
      : _config.anchor;
    if (!anchor) throw new Error(`[AuthKit] anchor element not found: "${_config.anchor}"`);
    anchor.setAttribute('data-authkit', '');

    // Apply theme to anchor
    applyTheme(anchor, _config.ui?.theme ?? 'auto');

    // Init Firebase session
    await initSession(_config.firebase, {
      afterLogin:  _config.redirects?.afterLogin,
      onLogin:     _config.onLogin,
      onLogout:    _config.onLogout,
    }, _config.googleAuthMode);

    // Load all providers
    dispatch({ type: 'INIT' });
    _providers = await loadAll(_config.enabledProviders, _baseUrl);

    const auth          = getAuth_();
    const emailProvider = _providers.find(p => p.id === 'email');

    // Mount UI
    if (_config.loginMode === 'inline') {
      const { createInline } = await import('../ui/inline.js');
      _inline = createInline(anchor, _config);
      _inline.update(_providers, auth);

      // Show/hide inline based on auth state
      subscribe((state) => {
        if (state.status === 'authenticated') _inline.hide();
        else _inline.show();
      });
    } else {
      // Modal — lazy, created on first showLogin()
      const { createModal } = await import('../ui/modal.js');
      _modal = createModal(_config);

      // Auto-show modal when unauthenticated if loginMode requests it
      if (_config.autoShowLogin) {
        subscribe((state) => {
          if (state.status === 'unauthenticated') {
            _modal.show(_providers, auth, emailProvider);
          }
        });
      }
    }

    // Expose on window for non-module usage
    if (typeof window !== 'undefined') window.AuthKit = AuthKit;

    return AuthKit;
  },

  get currentUser() {
    return getState().user ?? null;
  },

  onAuthStateChanged(cb) {
    let prev = null;
    return subscribe((state) => {
      const current = state.user ?? null;
      if (current !== prev) {
        prev = current;
        cb(current);
      }
    });
  },

  async signOut() {
    const { signOut } = await import(`https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js`);
    dispatch({ type: 'SIGN_OUT' });
    await signOut(getAuth_());
  },

  showLogin() {
    if (_inline) { _inline.show(); return; }
    if (_modal) {
      const auth          = getAuth_();
      const emailProvider = _providers.find(p => p.id === 'email');
      _modal.show(_providers, auth, emailProvider);
    }
  },

  hideLogin() {
    _inline?.hide();
    _modal?.hide();
  },

  requireAuth(opts = {}) {
    const state = getState();
    if (state.status === 'authenticated') return true;

    const loginPage = opts.loginPage ?? _config?.redirects?.loginPage ?? '/login.html';
    setPostLoginRedirect(location.href);
    location.href = `${loginPage}?redirect=${encodeURIComponent(location.href)}`;
    return false;
  },

  async renderSettings(selector) {
    const container = typeof selector === 'string'
      ? document.querySelector(selector)
      : selector;
    if (!container) throw new Error(`[AuthKit] renderSettings: element not found: "${selector}"`);

    const { render } = await import('../ui/settings.js');
    await render(container, _config, getAuth_(), getApp_());
  },

  registerProvider(module) {
    _registerProvider(module);
  },

  subscribe,
  getState,
};

function _inferBaseUrl() {
  // Try to infer base URL from the currently executing script
  const scripts = document.querySelectorAll('script[src]');
  for (const s of scripts) {
    if (s.src.includes('authkit') || s.src.includes('index.js')) {
      return s.src.replace(/\/[^/]+$/, '');
    }
  }
  return '.';
}
