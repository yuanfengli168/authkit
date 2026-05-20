import { injectStyles, ce } from '../utils/dom.js';
import { dispatch, getState, subscribe } from '../core/state.js';
import { renderProviderButton } from './components/provider-button.js';
import { renderEmailForm } from './components/email-form.js';

const MODAL_CSS = `
[data-authkit] .ak-overlay {
  position: fixed;
  inset: 0;
  background: var(--ak-overlay-bg);
  z-index: var(--ak-z-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}
[data-authkit] .ak-overlay.visible {
  opacity: 1;
}
[data-authkit] .ak-modal {
  background: var(--ak-color-bg);
  border-radius: var(--ak-radius-lg);
  box-shadow: var(--ak-modal-shadow);
  width: var(--ak-modal-width);
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 64px);
  overflow-y: auto;
  padding: var(--ak-spacing-xl);
  z-index: var(--ak-z-modal);
  transform: scale(0.95);
  transition: transform 0.2s ease;
  box-sizing: border-box;
}
[data-authkit] .ak-overlay.visible .ak-modal {
  transform: scale(1);
}
[data-authkit] .ak-modal-header {
  text-align: center;
  margin-bottom: var(--ak-spacing-lg);
}
[data-authkit] .ak-modal-logo {
  font-size: 32px;
  margin-bottom: var(--ak-spacing-sm);
  display: block;
}
[data-authkit] .ak-modal-title {
  font-size: var(--ak-font-size-lg);
  font-weight: 600;
  color: var(--ak-color-text);
  margin: 0;
  id: ak-modal-title;
}
[data-authkit] .ak-modal-subtitle {
  font-size: var(--ak-font-size-sm);
  color: var(--ak-color-text-secondary);
  margin: var(--ak-spacing-xs) 0 0;
}
[data-authkit] .ak-modal-close {
  position: absolute;
  top: var(--ak-spacing-md);
  right: var(--ak-spacing-md);
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--ak-color-text-secondary);
  line-height: 1;
  padding: 4px;
  border-radius: var(--ak-radius-sm);
}
[data-authkit] .ak-modal-close:hover {
  background: var(--ak-color-bg-subtle);
}
[data-authkit] .ak-modal-body {
  display: flex;
  flex-direction: column;
  gap: var(--ak-spacing-sm);
}
[data-authkit] .ak-modal-divider {
  display: flex;
  align-items: center;
  gap: var(--ak-spacing-sm);
  color: var(--ak-color-text-secondary);
  font-size: var(--ak-font-size-sm);
  margin: var(--ak-spacing-sm) 0;
}
[data-authkit] .ak-modal-divider::before,
[data-authkit] .ak-modal-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--ak-color-border);
}
[data-authkit] .ak-modal-status {
  font-size: var(--ak-font-size-sm);
  text-align: center;
  padding: var(--ak-spacing-sm);
  color: var(--ak-color-error);
  min-height: 24px;
}
[data-authkit] .ak-modal-wrapper {
  position: relative;
}
`;

export function createModal(config) {
  injectStyles('modal', MODAL_CSS);

  let _overlay = null;
  let _providers = [];
  let _auth = null;
  let _unsubState = null;
  let _focusableEls = [];

  function buildModal() {
    _overlay = ce('div', {
      className: 'ak-overlay',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'ak-modal-title',
      'data-authkit': '',
    });
    if (config.theme) _overlay.setAttribute('data-theme', config.theme);

    const wrapper = ce('div', { className: 'ak-modal-wrapper' });
    const modal = ce('div', { className: 'ak-modal' });

    // Close button
    const closeBtn = ce('button', {
      className: 'ak-modal-close',
      type: 'button',
      'aria-label': 'Close',
    }, '×');
    closeBtn.addEventListener('click', hide);

    // Header
    const header = ce('div', { className: 'ak-modal-header' });
    if (config.logoUrl) {
      const logo = ce('img', {
        className: 'ak-modal-logo',
        src: config.logoUrl,
        alt: config.brandName || '',
        style: { width: '48px', height: '48px', borderRadius: '8px' },
      });
      header.appendChild(logo);
    } else if (config.brandEmoji) {
      header.appendChild(ce('span', { className: 'ak-modal-logo' }, config.brandEmoji));
    }

    const titleEl = ce('h2', { className: 'ak-modal-title', id: 'ak-modal-title' },
      config.loginTitle || `Sign in to ${config.brandName || 'continue'}`
    );
    const subtitleEl = ce('p', { className: 'ak-modal-subtitle' },
      config.loginSubtitle || ''
    );
    header.append(titleEl, subtitleEl);

    // Body with providers
    const body = ce('div', { className: 'ak-modal-body' });
    const statusEl = ce('div', { className: 'ak-modal-status', 'aria-live': 'polite' });

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
        body.appendChild(ce('div', { className: 'ak-modal-divider' }, 'or'));
      }
      const emailProvider = _providers.find(p => p.id === 'email');
      const emailForm = renderEmailForm(emailProvider, _auth, dispatch);
      body.appendChild(emailForm);
    }

    modal.append(closeBtn, header, body, statusEl);
    wrapper.appendChild(modal);
    _overlay.appendChild(wrapper);

    // Click outside to close
    _overlay.addEventListener('click', (e) => {
      if (e.target === _overlay) hide();
    });

    // Escape key
    _overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') hide();
      if (e.key === 'Tab') trapFocus(e);
    });

    document.body.appendChild(_overlay);

    // Subscribe to state for auto-hide on auth success
    _unsubState = subscribe((state) => {
      if (state.status === 'authenticated') {
        hide();
      }
    });
  }

  function trapFocus(e) {
    if (!_overlay) return;
    const focusable = _overlay.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    _focusableEls = [...focusable].filter(el => !el.disabled && el.offsetParent !== null);
    if (_focusableEls.length === 0) return;
    const first = _focusableEls[0];
    const last = _focusableEls[_focusableEls.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { last.focus(); e.preventDefault(); }
    } else {
      if (document.activeElement === last) { first.focus(); e.preventDefault(); }
    }
  }

  function show() {
    if (!_overlay) buildModal();
    _overlay.style.display = 'flex';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        _overlay.classList.add('visible');
      });
    });
    document.body.style.overflow = 'hidden';
    // Focus first focusable element
    const firstFocusable = _overlay.querySelector('button, input');
    if (firstFocusable) firstFocusable.focus();
  }

  function hide() {
    if (!_overlay) return;
    _overlay.classList.remove('visible');
    document.body.style.overflow = '';
    setTimeout(() => {
      if (_overlay) _overlay.style.display = 'none';
    }, 200);
  }

  function update(providers, auth) {
    _providers = providers;
    _auth = auth;
    // Rebuild modal if already created
    if (_overlay) {
      _overlay.remove();
      _overlay = null;
      if (_unsubState) { _unsubState(); _unsubState = null; }
    }
  }

  return { show, hide, update };
}
