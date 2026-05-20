// ui/components/provider-button.js — Renders a single provider sign-in button

import { ce } from '../../utils/dom.js';

export function renderProviderButton(provider, onClick) {
  const btn = ce('button', {
    className: `ak-provider-btn ak-provider-btn--${provider.id}`,
    type: 'button',
    'aria-label': provider.label,
  });

  const iconWrap = ce('span', { className: 'ak-provider-btn__icon', innerHTML: provider.icon });
  const label    = ce('span', { className: 'ak-provider-btn__label' }, provider.label);
  const spinner  = ce('span', { className: 'ak-provider-btn__spinner ak-hidden', 'aria-hidden': 'true' });

  btn.append(iconWrap, label, spinner);

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    spinner.classList.remove('ak-hidden');
    label.textContent = 'Signing in…';
    try {
      await onClick(provider);
    } catch { /* errors handled upstream */ } finally {
      btn.disabled = false;
      spinner.classList.add('ak-hidden');
      label.textContent = provider.label;
    }
  });

  return btn;
}

export const PROVIDER_BTN_CSS = `
.ak-provider-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--ak-spacing-sm);
  width: 100%;
  height: var(--ak-btn-height);
  padding: 0 var(--ak-spacing-md);
  border-radius: var(--ak-btn-radius);
  font-size: var(--ak-font-size-sm);
  font-weight: var(--ak-btn-font-weight);
  font-family: var(--ak-font-family);
  cursor: pointer;
  transition: background 0.15s, box-shadow 0.15s, opacity 0.15s;
  border: 1px solid var(--ak-color-border);
  background: var(--ak-color-surface);
  color: var(--ak-color-text);
}
.ak-provider-btn:hover:not(:disabled) {
  box-shadow: 0 1px 4px rgba(0,0,0,0.12);
}
.ak-provider-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.ak-provider-btn--google  { background: #fff; color: #3c4043; border-color: #dadce0; }
.ak-provider-btn--google:hover:not(:disabled) { background: #f8f9fa; }
.ak-provider-btn__icon { display: flex; align-items: center; flex-shrink: 0; }
.ak-provider-btn__spinner {
  width: 14px; height: 14px;
  border: 2px solid var(--ak-color-border);
  border-top-color: var(--ak-color-primary);
  border-radius: 50%;
  animation: ak-spin 0.65s linear infinite;
  flex-shrink: 0;
}
@keyframes ak-spin { to { transform: rotate(360deg); } }
`;
