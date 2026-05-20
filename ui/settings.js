// ui/settings.js — Settings page renderer

import { ce, injectStyles } from '../utils/dom.js';
import { getState, subscribe } from '../core/state.js';
import { getFirestoreClient } from '../core/firestore.js';
import { renderAccountSection }    from './components/account-section.js';
import { renderConnectedSection }  from './components/connected-section.js';
import { renderSavedKeysSection }  from './components/saved-keys-section.js';
import { renderDangerZone }        from './components/danger-zone.js';
import { listLoaded }              from '../core/registry.js';

const SETTINGS_CSS = `
[data-authkit] .ak-settings { font-family: var(--ak-font-family); color: var(--ak-color-text); max-width: 600px; }
[data-authkit] .ak-settings-section {
  background: var(--ak-color-surface);
  border: 1px solid var(--ak-color-border);
  border-radius: var(--ak-radius-md);
  padding: var(--ak-spacing-lg);
  margin-bottom: var(--ak-spacing-md);
}
[data-authkit] .ak-settings-section__title {
  font-size: 1rem; font-weight: 700; margin: 0 0 var(--ak-spacing-md);
  color: var(--ak-color-text);
}
[data-authkit] .ak-settings-label {
  display: block; font-size: var(--ak-font-size-sm);
  color: var(--ak-color-text-secondary); margin-bottom: 4px; margin-top: var(--ak-spacing-sm);
}
[data-authkit] .ak-settings-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--ak-spacing-sm) 0; border-bottom: 1px solid var(--ak-color-border);
  margin-bottom: var(--ak-spacing-sm);
}
[data-authkit] .ak-settings-value { color: var(--ak-color-text-secondary); font-size: var(--ak-font-size-sm); }
[data-authkit] .ak-avatar-preview {
  width: 48px; height: 48px; border-radius: 50%; object-fit: cover;
  margin: var(--ak-spacing-sm) 0; border: 2px solid var(--ak-color-border);
}
[data-authkit] .ak-connected-list { display: flex; flex-direction: column; gap: var(--ak-spacing-sm); }
[data-authkit] .ak-connected-row {
  display: flex; align-items: center; gap: var(--ak-spacing-sm);
  padding: var(--ak-spacing-sm) 0; border-bottom: 1px solid var(--ak-color-border);
}
[data-authkit] .ak-connected-label { display: flex; align-items: center; gap: var(--ak-spacing-sm); flex: 1; font-size: var(--ak-font-size-sm); }
[data-authkit] .ak-connected-icon { display: flex; align-items: center; }
[data-authkit] .ak-connected-status { font-size: 12px; color: var(--ak-color-text-secondary); min-width: 90px; text-align: right; }
[data-authkit] .ak-connected-status--linked { color: var(--ak-color-success); }
[data-authkit] .ak-keys-list { display: flex; flex-direction: column; gap: var(--ak-spacing-sm); margin-bottom: var(--ak-spacing-md); }
[data-authkit] .ak-key-row {
  display: flex; align-items: center; gap: var(--ak-spacing-sm);
  padding: var(--ak-spacing-sm); background: var(--ak-color-bg-subtle);
  border-radius: var(--ak-radius-sm); border: 1px solid var(--ak-color-border);
}
[data-authkit] .ak-key-name { font-size: var(--ak-font-size-sm); font-weight: 600; flex: 1; word-break: break-all; }
[data-authkit] .ak-key-value { font-size: 12px; font-family: monospace; color: var(--ak-color-text-secondary); min-width: 80px; }
[data-authkit] .ak-key-action {
  background: none; border: none; cursor: pointer; padding: 4px; font-size: 14px; border-radius: var(--ak-radius-sm);
}
[data-authkit] .ak-key-action:hover { background: var(--ak-color-border); }
[data-authkit] .ak-key-action--delete:hover { background: var(--ak-color-error-bg); }
[data-authkit] .ak-keys-empty { color: var(--ak-color-text-secondary); font-size: var(--ak-font-size-sm); padding: var(--ak-spacing-sm) 0; }
[data-authkit] .ak-keys-add-form {
  display: flex; gap: var(--ak-spacing-sm); align-items: flex-end; flex-wrap: wrap;
  padding-top: var(--ak-spacing-md);
}
[data-authkit] .ak-keys-add-form .ak-input { flex: 1; min-width: 120px; }
[data-authkit] .ak-divider-line { border: none; border-top: 1px solid var(--ak-color-border); margin: var(--ak-spacing-md) 0; }
[data-authkit] .ak-danger-zone { border-color: var(--ak-color-error); }
[data-authkit] .ak-delete-card {
  border: 1px solid var(--ak-color-error); border-radius: var(--ak-radius-md);
  padding: var(--ak-spacing-md); background: var(--ak-color-error-bg);
}
[data-authkit] .ak-delete-desc { font-size: var(--ak-font-size-sm); color: var(--ak-color-error); margin-bottom: var(--ak-spacing-md); }
[data-authkit] .ak-settings-loading { color: var(--ak-color-text-secondary); padding: var(--ak-spacing-lg) 0; }
`;

export async function render(container, config, auth, app) {
  injectStyles('settings', SETTINGS_CSS);
  container.setAttribute('data-authkit', '');
  container.innerHTML = '';

  const state = getState();
  if (state.status !== 'authenticated' || !state.user) {
    container.append(ce('p', { className: 'ak-settings-loading' }, 'Loading…'));
    // Wait for auth state
    const unsub = subscribe(async (s) => {
      if (s.status === 'authenticated' && s.user) {
        unsub();
        await render(container, config, auth, app);
      } else if (s.status === 'unauthenticated') {
        unsub();
        const loginPage = config.redirects?.loginPage ?? '/login.html';
        const redirect  = encodeURIComponent(location.href);
        location.href = `${loginPage}?redirect=${redirect}`;
      }
    });
    return;
  }

  const user    = state.user;
  const wrapper = ce('div', { className: 'ak-settings' });

  // Account
  wrapper.append(renderAccountSection(user, auth));

  // Connected accounts (only for linkable providers)
  const loaded = listLoaded();
  if (loaded.some(p => p.canLink)) {
    wrapper.append(renderConnectedSection(user, auth, loaded));
  }

  // Saved keys
  if (config.settings?.enableSavedKeys !== false) {
    let db = null;
    try {
      db = await getFirestoreClient(app);
    } catch { /* Firestore unavailable */ }
    if (db) {
      wrapper.append(renderSavedKeysSection(user, db, config.settings?.firestoreCollection ?? 'users'));
    }
  }

  // Danger zone
  let db = null;
  if (config.settings?.enableSavedKeys !== false) {
    try { db = await getFirestoreClient(app); } catch { /* ok */ }
  }
  wrapper.append(renderDangerZone(user, auth, db, config));

  container.append(wrapper);

  // Redirect if user logs out while on this page
  subscribe((s) => {
    if (s.status === 'unauthenticated') {
      location.href = config.redirects?.afterLogout ?? '/';
    }
  });
}
