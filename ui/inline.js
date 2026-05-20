import { injectStyles, ce } from '../utils/dom.js';
import { dispatch, subscribe } from '../core/state.js';
import { renderProviderButton } from './components/provider-button.js';
import { renderEmailForm } from './components/email-form.js';

const INLINE_CSS = `
[data-authkit] .ak-inline {
  background: var(--ak-color-bg);
  border: 1px solid var(--ak-color-border);
  border-radius: var(--ak-radius-lg);
  padding: var(--ak-spacing-xl);
  max-width: var(--ak-modal-width);
  box-sizing: border-box;
}
[data-authkit] .ak-inline-header {
  text-align: center;
  margin-bottom: var(--ak-spacing-lg);
}
[data-authkit] .ak-inline-title {
  font-size: var(--ak-font-size-lg);
  font-weight: 600;
  color: var(--ak-color-text);
  margin: 0 0 var(--ak-spacing-xs) 0;
}
[data-authkit] .ak-inline-subtitle {
  font-size: var(--ak-font-size-sm);
  color: var(--ak-color-text-secondary);
  margin: 0;
}
[data-authkit] .ak-inline-body {
  display: flex;
  flex-direction: column;
  gap: var(--ak-spacing-sm);
}
[data-authkit] .ak-inline-divider {
  display: flex;
  align-items: center;
  gap: var(--ak-spacing-sm);
  color: var(--ak-color-text-secondary);
  font-size: var(--ak-font-size-sm);
  margin: var(--ak-spacing-sm) 0;
}
[data-authkit] .ak-inline-divider::before,
[data-authkit] .ak-inline-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--ak-color-border);
}
[data-authkit] .ak-inline-status {
  font-size: var(--ak-font-size-sm);
  text-align: center;
  color: var(--ak-color-error);
  min-height: 20px;
}
`;

export function createInline(anchor, config) {
  injectStyles('inline', INLINE_CSS);

  let _providers = [];
  let _auth = null;
  let _rendered = false;
  let _unsubState = null;

  // Apply data-authkit to anchor
  anchor.setAttribute('data-authkit', '');
  if (config.theme) anchor.setAttribute('data-theme', config.theme);

  function render() {
    anchor.innerHTML = '';

    const container = ce('div', { className: 'ak-inline' });

    const header = ce('div', { className: 'ak-inline-header' });
    const titleEl = ce('h2', { className: 'ak-inline-title' },
      config.loginTitle || `Sign in to ${config.brandName || 'continue'}`
    );
    const subtitleEl = ce('p', { className: 'ak-inline-subtitle' },
      config.loginSubtitle || ''
    );
    header.append(titleEl, subtitleEl);

    const body = ce('div', { className: 'ak-inline-body' });
    const statusEl = ce('div', { className: 'ak-inline-status', 'aria-live': 'polite' });

    let hasEmailProvider = false;
    for (const provider of _providers) {
      if (provider.id === 'email') {
        hasEmailProvider = true;
        continue;
      }
      const btn = renderProviderButton(provider, async (p) => {
        dispatch({ type: 'PROVIDER_START', provider: p.id });
        try {
          await p.signIn(_auth, { mode: config.googleAuthMode || 'popup' });
        } catch (e) {
          if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
            statusEl.textContent = e.message || 'Sign in failed.';
            dispatch({ type: 'CLEAR_ERROR' });
          }
        }
      });
      body.appendChild(btn);
    }

    if (hasEmailProvider) {
      if (_providers.filter(p => p.id !== 'email').length > 0) {
        body.appendChild(ce('div', { className: 'ak-inline-divider' }, 'or'));
      }
      const emailProvider = _providers.find(p => p.id === 'email');
      const emailForm = renderEmailForm(emailProvider, _auth, dispatch);
      body.appendChild(emailForm);
    }

    container.append(header, body, statusEl);
    anchor.appendChild(container);
    anchor.style.display = '';
    _rendered = true;

    if (!_unsubState) {
      _unsubState = subscribe((state) => {
        if (state.status === 'authenticated') {
          hide();
        } else if (state.status === 'unauthenticated') {
          show();
        }
      });
    }
  }

  function show() {
    if (!_rendered) render();
    anchor.style.display = '';
  }

  function hide() {
    anchor.style.display = 'none';
  }

  function update(providers, auth) {
    _providers = providers;
    _auth = auth;
    render();
  }

  return { show, hide, update };
}
