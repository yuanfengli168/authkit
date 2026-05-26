// ui/components/account-section.js — Account info editor

import { ce } from '../../utils/dom.js';

const FB_SDK = 'https://www.gstatic.com/firebasejs/10.12.0';

export function renderAccountSection(user, auth) {
  const section = ce('div', { className: 'ak-settings-section' });
  const title   = ce('h3', { className: 'ak-settings-section__title' }, '👤 Account');

  const nameInput = ce('input', {
    className: 'ak-input', type: 'text',
    placeholder: 'Display name', value: user.displayName ?? '',
  });
  const photoInput = ce('input', {
    className: 'ak-input', type: 'url',
    placeholder: 'Photo URL (https://...)', value: user.photoURL ?? '',
  });
  const preview = ce('img', {
    className: 'ak-avatar-preview',
    src: user.photoURL ?? '',
    alt: 'Avatar preview',
    style: { display: user.photoURL ? 'block' : 'none' },
  });
  photoInput.addEventListener('input', () => {
    const v = photoInput.value.trim();
    preview.src = v;
    preview.style.display = v ? 'block' : 'none';
  });

  const emailRow = ce('div', { className: 'ak-settings-row' },
    ce('label', { className: 'ak-settings-label' }, 'Email'),
    ce('span', { className: 'ak-settings-value' }, user.email ?? '—'),
  );

  const saveBtn   = ce('button', { className: 'ak-btn ak-btn--primary', type: 'button', style: { width: 'auto', padding: '0 var(--ak-spacing-lg)' } }, 'Save');
  const feedbackEl = ce('p', { className: 'ak-form-success ak-hidden' });

  saveBtn.addEventListener('click', async () => {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';
    feedbackEl.classList.add('ak-hidden');
    try {
      // Bug 17 fix: guard against null currentUser
      if (!auth.currentUser) {
        feedbackEl.textContent = '❌ You are no longer signed in. Please refresh and try again.';
        feedbackEl.classList.remove('ak-hidden');
        return;
      }
      const { updateProfile } = await import(`${FB_SDK}/firebase-auth.js`);
      await updateProfile(auth.currentUser, {
        displayName: nameInput.value.trim() || null,
        photoURL:    photoInput.value.trim() || null,
      });
      feedbackEl.textContent = '✅ Profile updated.';
      feedbackEl.classList.remove('ak-hidden');
    } catch (err) {
      feedbackEl.textContent = `❌ ${err.message}`;
      feedbackEl.classList.remove('ak-hidden');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save';
    }
  });

  section.append(
    title,
    emailRow,
    ce('label', { className: 'ak-settings-label' }, 'Display Name'),
    nameInput,
    ce('label', { className: 'ak-settings-label' }, 'Photo URL'),
    photoInput,
    preview,
    saveBtn,
    feedbackEl,
  );
  return section;
}
