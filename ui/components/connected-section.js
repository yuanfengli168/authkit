// ui/components/connected-section.js — Link/unlink provider accounts

import { ce } from '../../utils/dom.js';

export function renderConnectedSection(user, auth, loadedProviders) {
  const section = ce('div', { className: 'ak-settings-section' });
  section.append(ce('h3', { className: 'ak-settings-section__title' }, '🔗 Connected Accounts'));

  const list = ce('div', { className: 'ak-connected-list' });
  section.append(list);

  function refresh(currentUser) {
    list.innerHTML = '';
    const linkedIds = new Set(currentUser.providerData?.map(p => p.providerId) ?? []);

    for (const provider of loadedProviders) {
      if (!provider.canLink) continue;
      const provId   = provider.id + (provider.id === 'google' ? '.com' : '');
      const isLinked = linkedIds.has(provId);
      const row      = ce('div', { className: 'ak-connected-row' });
      const label    = ce('span', { className: 'ak-connected-label' },
        ce('span', { innerHTML: provider.icon, className: 'ak-connected-icon' }),
        provider.label.replace('Continue with ', ''),
      );
      const statusEl = ce('span', {
        className: `ak-connected-status ${isLinked ? 'ak-connected-status--linked' : ''}`,
      }, isLinked ? '✓ Connected' : 'Not connected');

      const actionBtn = ce('button', {
        className: `ak-btn ak-btn--secondary ak-connected-action`,
        type: 'button',
        style: { width: 'auto', padding: '0 var(--ak-spacing-md)', height: '32px', fontSize: '12px' },
      }, isLinked ? 'Unlink' : 'Link');

      // Disable unlink if it's the only provider
      if (isLinked && linkedIds.size <= 1) {
        actionBtn.disabled = true;
        actionBtn.title = 'Cannot unlink your only sign-in method';
      }

      actionBtn.addEventListener('click', async () => {
        actionBtn.disabled = true;
        actionBtn.textContent = 'Please wait…';
        try {
          if (isLinked) {
            await provider.unlinkAccount(currentUser);
          } else {
            await provider.linkAccount(auth);
          }
          // Re-fetch user and re-render
          const freshUser = auth.currentUser;
          refresh(freshUser);
        } catch (err) {
          actionBtn.disabled = false;
          actionBtn.textContent = isLinked ? 'Unlink' : 'Link';
          const errEl = section.querySelector('.ak-connected-error') ?? ce('p', { className: 'ak-form-error ak-connected-error' });
          errEl.textContent = err.message;
          section.appendChild(errEl);
        }
      });

      row.append(label, statusEl, actionBtn);
      list.append(row);
    }
  }

  refresh(user._raw ?? user);
  return section;
}
