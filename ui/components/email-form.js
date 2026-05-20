// ui/components/email-form.js — Email+password form (login / register / reset)

import { ce } from '../../utils/dom.js';
import { friendlyError } from '../../providers/email.js';
import { dispatch } from '../../core/state.js';

export function renderEmailForm(emailProvider, auth) {
  let mode = 'login'; // 'login' | 'register' | 'reset'

  const root = ce('div', { className: 'ak-email-form' });

  // ── Tabs ─────────────────────────────────────────────────
  const tabs = ce('div', { className: 'ak-email-tabs', role: 'tablist' });
  const tabLogin = ce('button', {
    className: 'ak-email-tab ak-email-tab--active',
    type: 'button', role: 'tab', 'aria-selected': 'true',
  }, 'Sign In');
  const tabRegister = ce('button', {
    className: 'ak-email-tab',
    type: 'button', role: 'tab', 'aria-selected': 'false',
  }, 'Sign Up');
  tabs.append(tabLogin, tabRegister);

  // ── Fields ────────────────────────────────────────────────
  const emailInput = ce('input', {
    className: 'ak-input', type: 'email', placeholder: 'Email address',
    autocomplete: 'email', required: 'true',
  });
  const passInput = ce('input', {
    className: 'ak-input', type: 'password', placeholder: 'Password',
    autocomplete: 'current-password', required: 'true',
  });

  const forgotLink = ce('a', {
    className: 'ak-email-forgot', href: '#', role: 'button',
  }, 'Forgot password?');

  const submitBtn = ce('button', {
    className: 'ak-btn ak-btn--primary', type: 'submit',
  }, 'Sign In');

  const errorEl = ce('p', { className: 'ak-form-error ak-hidden', role: 'alert' });

  const resetMsg = ce('p', {
    className: 'ak-form-success ak-hidden',
  }, '✅ Password reset email sent. Check your inbox.');

  const backLink = ce('a', {
    className: 'ak-email-forgot ak-hidden', href: '#', role: 'button',
  }, '← Back to sign in');

  // ── Render helpers ────────────────────────────────────────
  function setError(msg) {
    if (msg) {
      errorEl.textContent = msg;
      errorEl.classList.remove('ak-hidden');
    } else {
      errorEl.classList.add('ak-hidden');
    }
  }

  function setMode(m) {
    mode = m;
    setError('');
    resetMsg.classList.add('ak-hidden');

    if (m === 'reset') {
      tabs.classList.add('ak-hidden');
      passInput.classList.add('ak-hidden');
      forgotLink.classList.add('ak-hidden');
      backLink.classList.remove('ak-hidden');
      submitBtn.textContent = 'Send Reset Email';
      emailInput.placeholder = 'Your email address';
    } else {
      tabs.classList.remove('ak-hidden');
      passInput.classList.remove('ak-hidden');
      backLink.classList.add('ak-hidden');
      forgotLink.classList.remove('ak-hidden');
      submitBtn.textContent = m === 'login' ? 'Sign In' : 'Create Account';
      emailInput.placeholder = 'Email address';
      passInput.placeholder = m === 'register' ? 'Create a password (min 6 chars)' : 'Password';
      passInput.setAttribute('autocomplete', m === 'register' ? 'new-password' : 'current-password');
    }

    tabLogin.classList.toggle('ak-email-tab--active', m === 'login');
    tabLogin.setAttribute('aria-selected', String(m === 'login'));
    tabRegister.classList.toggle('ak-email-tab--active', m === 'register');
    tabRegister.setAttribute('aria-selected', String(m === 'register'));
  }

  // ── Submit ────────────────────────────────────────────────
  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    const email    = emailInput.value.trim();
    const password = passInput.value;

    if (!email) { setError('Please enter your email.'); return; }
    if (mode !== 'reset' && !password) { setError('Please enter your password.'); return; }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Please wait…';
    dispatch({ type: 'PROVIDER_START', providerId: 'email' });

    try {
      if (mode === 'login') {
        await emailProvider.signIn(auth, { email, password });
      } else if (mode === 'register') {
        await emailProvider.signUp(auth, { email, password });
      } else {
        await emailProvider.resetPassword(auth, { email });
        resetMsg.classList.remove('ak-hidden');
        setMode('login');
        return;
      }
      // onAuthStateChanged → state machine handles the rest
    } catch (err) {
      dispatch({ type: 'CLEAR_ERROR' });
      setError(friendlyError(err));
    } finally {
      submitBtn.disabled = false;
      setMode(mode); // restore button label
    }
  }

  // ── Events ────────────────────────────────────────────────
  tabLogin.addEventListener('click',    () => setMode('login'));
  tabRegister.addEventListener('click', () => setMode('register'));
  forgotLink.addEventListener('click',  (e) => { e.preventDefault(); setMode('reset'); });
  backLink.addEventListener('click',    (e) => { e.preventDefault(); setMode('login'); });

  const form = ce('form', { className: 'ak-email-form__inner', noValidate: 'true' });
  form.addEventListener('submit', onSubmit);
  [emailInput, passInput].forEach(el =>
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter') form.requestSubmit?.(); })
  );

  form.append(emailInput, passInput, forgotLink, submitBtn, errorEl, resetMsg);
  root.append(tabs, backLink, form);
  return root;
}

export const EMAIL_FORM_CSS = `
.ak-email-tabs {
  display: flex;
  border-bottom: 1px solid var(--ak-color-border);
  margin-bottom: var(--ak-spacing-md);
}
.ak-email-tab {
  flex: 1;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  padding: var(--ak-spacing-sm) 0;
  font-size: var(--ak-font-size-sm);
  font-family: var(--ak-font-family);
  font-weight: 500;
  color: var(--ak-color-text-secondary);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  margin-bottom: -1px;
}
.ak-email-tab--active {
  color: var(--ak-color-primary);
  border-bottom-color: var(--ak-color-primary);
}
.ak-email-tab:hover { color: var(--ak-color-text); }
.ak-input {
  display: block;
  width: 100%;
  padding: 0 var(--ak-spacing-md);
  height: 42px;
  border-radius: var(--ak-radius-sm);
  border: 1px solid var(--ak-color-border);
  background: var(--ak-color-bg);
  color: var(--ak-color-text);
  font-size: var(--ak-font-size-sm);
  font-family: var(--ak-font-family);
  outline: none;
  box-sizing: border-box;
  margin-bottom: var(--ak-spacing-sm);
  transition: border-color 0.15s;
}
.ak-input:focus { border-color: var(--ak-color-primary); }
.ak-input::placeholder { color: var(--ak-color-text-secondary); }
.ak-email-forgot {
  display: block;
  font-size: 12px;
  color: var(--ak-color-primary);
  text-decoration: none;
  text-align: right;
  margin-bottom: var(--ak-spacing-md);
  cursor: pointer;
}
.ak-email-forgot:hover { text-decoration: underline; }
.ak-btn {
  display: block;
  width: 100%;
  height: var(--ak-btn-height);
  border-radius: var(--ak-btn-radius);
  border: none;
  font-size: var(--ak-font-size-sm);
  font-weight: var(--ak-btn-font-weight);
  font-family: var(--ak-font-family);
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
}
.ak-btn--primary {
  background: var(--ak-color-primary);
  color: var(--ak-color-primary-text);
  margin-bottom: var(--ak-spacing-sm);
}
.ak-btn--primary:hover:not(:disabled) { background: var(--ak-color-primary-hover); }
.ak-btn--primary:disabled { opacity: 0.5; cursor: not-allowed; }
.ak-btn--danger {
  background: var(--ak-color-error);
  color: #fff;
}
.ak-btn--danger:hover:not(:disabled) { opacity: 0.88; }
.ak-btn--danger:disabled { opacity: 0.5; cursor: not-allowed; }
.ak-btn--secondary {
  background: var(--ak-color-bg-subtle);
  color: var(--ak-color-text);
  border: 1px solid var(--ak-color-border);
}
.ak-btn--secondary:hover:not(:disabled) { border-color: var(--ak-color-primary); color: var(--ak-color-primary); }
.ak-form-error {
  font-size: 13px;
  color: var(--ak-color-error);
  background: var(--ak-color-error-bg);
  border: 1px solid var(--ak-color-error);
  border-radius: var(--ak-radius-sm);
  padding: var(--ak-spacing-sm) var(--ak-spacing-md);
  margin-top: var(--ak-spacing-sm);
}
.ak-form-success {
  font-size: 13px;
  color: var(--ak-color-success);
  padding: var(--ak-spacing-sm) 0;
}
`;
