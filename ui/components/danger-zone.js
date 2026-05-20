// ui/components/danger-zone.js — Sign out + delete account

import { ce } from '../../utils/dom.js';
import { deleteUserData } from '../../core/firestore.js';

const FB_SDK = 'https://www.gstatic.com/firebasejs/10.12.0';

export function renderDangerZone(user, auth, db, config) {
  const section = ce('div', { className: 'ak-settings-section ak-danger-zone' });
  section.append(ce('h3', { className: 'ak-settings-section__title' }, '⚠️ Danger Zone'));

  // ── Sign out all devices ──────────────────────────────────
  const signOutBtn = ce('button', { className: 'ak-btn ak-btn--secondary', type: 'button',
    style: { width: 'auto', padding: '0 var(--ak-spacing-lg)', marginBottom: 'var(--ak-spacing-md)' } },
    '🚪 Sign out');
  signOutBtn.addEventListener('click', async () => {
    const { signOut } = await import(`${FB_SDK}/firebase-auth.js`);
    await signOut(auth);
    const redir = config.redirects?.afterLogout ?? '/';
    location.href = redir;
  });
  section.append(signOutBtn);

  // ── Delete account ────────────────────────────────────────
  const deleteCard = ce('div', { className: 'ak-delete-card' });
  deleteCard.append(
    ce('p', { className: 'ak-delete-desc' },
      '⚠️ Deleting your account is permanent. Your data and API keys will be removed immediately.'),
  );

  const confirmInput = ce('input', {
    className: 'ak-input', type: 'email',
    placeholder: `Type ${user.email} to confirm`,
    autocomplete: 'off',
  });

  const deleteBtn = ce('button', {
    className: 'ak-btn ak-btn--danger', type: 'button',
    style: { width: 'auto', padding: '0 var(--ak-spacing-lg)' },
    disabled: 'true',
  }, 'Delete My Account');

  const deleteErr = ce('p', { className: 'ak-form-error ak-hidden', role: 'alert' });

  confirmInput.addEventListener('input', () => {
    deleteBtn.disabled = confirmInput.value.trim() !== user.email;
  });

  deleteBtn.addEventListener('click', async () => {
    deleteBtn.disabled = true;
    deleteBtn.textContent = 'Deleting…';
    deleteErr.classList.add('ak-hidden');
    try {
      // Delete Firestore data first
      if (db) {
        await deleteUserData(db, user.uid);
      }
      // Delete Firebase Auth account
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error('No authenticated user found.');
      await firebaseUser.delete();
      // Redirect
      location.href = config.redirects?.afterLogout ?? '/';
    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        deleteErr.textContent = 'For security, please sign out and sign in again before deleting your account.';
      } else {
        deleteErr.textContent = err.message;
      }
      deleteErr.classList.remove('ak-hidden');
      deleteBtn.disabled = false;
      deleteBtn.textContent = 'Delete My Account';
    }
  });

  deleteCard.append(confirmInput, deleteBtn, deleteErr);
  section.append(deleteCard);
  return section;
}
