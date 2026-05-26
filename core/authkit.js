// core/authkit.js — AuthKit public facade / singleton

import { dispatch, subscribe, getState } from './state.js';
import { initSession, getAuth_, getApp_ } from './session.js';
import { loadAll, registerProvider as _registerProvider, listLoaded } from './registry.js';
import { applyTheme }  from '../utils/theme.js';
import { injectStyles } from '../utils/dom.js';
import { setPostLoginRedirect, getPostLoginRedirect } from '../utils/redirect.js';
import { ensureBaseCSS } from './base-css.js';

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
let _initialized = false;  // Bug 6 fix: guard against double init()

// ── AuthKit singleton ─────────────────────────────────────────────────────────
export const AuthKit = {

  async init(userConfig) {
    // Bug 6 fix: guard against double init()
    if (_initialized) {
      console.warn('[AuthKit] Already initialized. Call AuthKit.destroy() first if you need to reinitialize.');
      return AuthKit;
    }
    _initialized = true;

    // Validate required fields
    if (!userConfig?.firebase) throw new Error('[AuthKit] config.firebase is required.');
    if (!userConfig?.anchor)   throw new Error('[AuthKit] config.anchor is required (CSS selector or element).');

    _config = mergeConfig(userConfig, DEFAULTS);

    // Base URL for provider dynamic imports
    _baseUrl = userConfig.baseUrl ?? _inferBaseUrl();

    // Inject base styles
    ensureBaseCSS();

    // Find anchor element
    const anchor = typeof _config.anchor === 'string'
      ? document.querySelector(_config.anchor)
      : _config.anchor;
    if (!anchor) throw new Error(`[AuthKit] anchor element not found: "${_config.anchor}"`);
    anchor.setAttribute('data-authkit', '');

    // Apply theme to anchor
    applyTheme(anchor, _config.ui?.theme ?? 'auto');

    // Enter 'loading' BEFORE wiring Firebase so the first
    // onAuthStateChanged callback (which fires asynchronously after
    // initSession resolves) is the last word on auth status. Dispatching
    // INIT *after* initSession would clobber an already-settled
    // 'unauthenticated'/'authenticated' state back to 'loading' and leave
    // the state machine stuck (the listener won't fire again until the
    // user actually changes), causing pages like settings.html to hang on
    // the "Loading…" placeholder forever.
    dispatch({ type: 'INIT' });

    // Init Firebase session
    await initSession(_config.firebase, {
      afterLogin:  _config.redirects?.afterLogin,
      onLogin:     _config.onLogin,
      onLogout:    _config.onLogout,
    }, _config.googleAuthMode);

    // Load all providers
    _providers = await loadAll(_config.enabledProviders, _baseUrl);

    const auth          = getAuth_();
    const emailProvider = _providers.find(p => p.id === 'email');

    // Mount UI
    if (_config.loginMode === 'inline') {
      const { createInline } = await import('../ui/inline.js');
      _inline = createInline(anchor, _config);
      _inline.update(_providers, auth);

      // Bug 12 fix: removed duplicate subscription here — createInline already
      // subscribes to auth state internally for show/hide behavior.
    } else {
      // Modal — lazy, created on first showLogin()
      const { createModal } = await import('../ui/modal.js');
      _modal = createModal(_config);

      // Auto-show modal when unauthenticated if loginMode requests it
      if (_config.autoShowLogin) {
        subscribe((state) => {
          if (state.status === 'unauthenticated') {
            // Bug 1 fix: call update() before show() to ensure providers/auth are set
            _modal.update(_providers, getAuth_());
            _modal.show();
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
    // Bug 7 fix: use undefined sentinel so initial unauthenticated state fires callback
    let prev = undefined;
    return subscribe((state) => {
      const current = state.user ?? null;
      if (current !== prev || prev === undefined) {
        prev = current;
        cb(current);
      }
    });
  },

  async signOut() {
    // Bug 8 fix: guard against calling before init()
    if (!getAuth_()) throw new Error('[AuthKit] Call init() first.');
    const { signOut } = await import(`https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js`);
    // Bug 4 fix: dispatch SIGN_OUT after signOut succeeds, or recover on failure
    try {
      await signOut(getAuth_());
    } catch (e) {
      // Recover from loading state if sign-out fails
      dispatch({ type: 'CLEAR_ERROR' });
      throw e;
    }
  },

  showLogin() {
    // Bug 8 fix: guard against calling before init()
    if (!_config) throw new Error('[AuthKit] Call init() first.');
    if (_inline) { _inline.show(); return; }
    if (_modal) {
      const auth          = getAuth_();
      const emailProvider = _providers.find(p => p.id === 'email');
      // Bug 1 fix: call update() before show() to ensure providers/auth are set
      _modal.update(_providers, auth);
      _modal.show();
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
    // Bug 5 fix: prevent infinite redirect loop if already on the login page
    try {
      const loginPath = new URL(loginPage, location.origin).pathname;
      if (location.pathname === loginPath) return false;
    } catch { /* if loginPage is not a valid URL, skip the check */ }

    setPostLoginRedirect(location.href);
    location.href = `${loginPage}?redirect=${encodeURIComponent(location.href)}`;
    return false;
  },

  async renderSettings(selector) {
    // Bug 8 fix: guard against calling before init()
    if (!_config) throw new Error('[AuthKit] Call init() first.');
    const container = typeof selector === 'string'
      ? document.querySelector(selector)
      : selector;
    if (!container) throw new Error(`[AuthKit] renderSettings: element not found: "${selector}"`);

    const { render } = await import('../ui/settings.js');
    return await render(container, _config, getAuth_(), getApp_());
  },

  async saveKey({ name, label, value }) {
    const state = getState();
    if (state.status !== 'authenticated' || !state.user) throw new Error('Not authenticated');
    const { getFirestoreClient, saveKey: _saveKey } = await import('./firestore.js');
    const db = await getFirestoreClient(getApp_());
    return _saveKey(db, state.user.uid, { name: name || label || 'key', value });
  },

  async getSavedKeys() {
    const state = getState();
    if (state.status !== 'authenticated' || !state.user) throw new Error('Not authenticated');
    const { getFirestoreClient, getSavedKeys: _getKeys } = await import('./firestore.js');
    const db = await getFirestoreClient(getApp_());
    return _getKeys(db, state.user.uid);
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
