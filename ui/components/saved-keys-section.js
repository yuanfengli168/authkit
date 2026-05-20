// ui/components/saved-keys-section.js — Firestore-backed key/value CRUD

import { ce } from '../../utils/dom.js';
import { getSavedKeys, saveKey, deleteKey } from '../../core/firestore.js';

export function renderSavedKeysSection(user, db, collectionName) {
  const section = ce('div', { className: 'ak-settings-section' });
  section.append(ce('h3', { className: 'ak-settings-section__title' }, '🔑 Saved Keys'));

  const listEl  = ce('div', { className: 'ak-keys-list' });
  const errEl   = ce('p', { className: 'ak-form-error ak-hidden' });
  const emptyEl = ce('p', { className: 'ak-keys-empty ak-hidden' }, 'No saved keys yet.');

  // ── Add form ──────────────────────────────────────────────
  const addForm = ce('form', { className: 'ak-keys-add-form' });
  const nameIn  = ce('input', { className: 'ak-input', type: 'text', placeholder: 'Key name', required: 'true', style: { marginBottom: '0' } });
  const valIn   = ce('input', { className: 'ak-input', type: 'text', placeholder: 'Value', required: 'true', style: { marginBottom: '0' } });
  const addBtn  = ce('button', { className: 'ak-btn ak-btn--primary', type: 'submit', style: { width: 'auto', padding: '0 var(--ak-spacing-md)', height: '42px' } }, '+ Add');
  addForm.append(nameIn, valIn, addBtn);

  addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name  = nameIn.value.trim();
    const value = valIn.value.trim();
    if (!name || !value) return;
    addBtn.disabled = true;
    try {
      await saveKey(db, user.uid, { name, value });
      nameIn.value = '';
      valIn.value  = '';
      await load();
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('ak-hidden');
    } finally {
      addBtn.disabled = false;
    }
  });

  // ── Load & render rows ────────────────────────────────────
  async function load() {
    listEl.innerHTML = '';
    errEl.classList.add('ak-hidden');
    try {
      const keys = await getSavedKeys(db, user.uid);
      emptyEl.classList.toggle('ak-hidden', keys.length > 0);
      for (const k of keys) {
        listEl.append(renderKeyRow(k));
      }
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('ak-hidden');
    }
  }

  function renderKeyRow(k) {
    const row     = ce('div', { className: 'ak-key-row' });
    const name    = ce('span', { className: 'ak-key-name' }, k.name);
    const masked  = '••••••••';
    const valEl   = ce('span', { className: 'ak-key-value' }, masked);
    let   revealed = false;

    const revealBtn = ce('button', { className: 'ak-key-action', type: 'button', title: 'Reveal', 'aria-label': 'Reveal value' }, '👁');
    revealBtn.addEventListener('click', () => {
      revealed = !revealed;
      valEl.textContent = revealed ? k.value : masked;
      revealBtn.title = revealed ? 'Hide' : 'Reveal';
    });

    const copyBtn = ce('button', { className: 'ak-key-action', type: 'button', title: 'Copy', 'aria-label': 'Copy value' }, '📋');
    copyBtn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(k.value);
      copyBtn.textContent = '✅';
      setTimeout(() => { copyBtn.textContent = '📋'; }, 1500);
    });

    const delBtn = ce('button', { className: 'ak-key-action ak-key-action--delete', type: 'button', title: 'Delete', 'aria-label': 'Delete key' }, '🗑');
    delBtn.addEventListener('click', async () => {
      if (!confirm(`Delete key "${k.name}"?`)) return;
      delBtn.disabled = true;
      try {
        await deleteKey(db, user.uid, k.id);
        row.remove();
        if (!listEl.children.length) emptyEl.classList.remove('ak-hidden');
      } catch (err) {
        errEl.textContent = err.message;
        errEl.classList.remove('ak-hidden');
        delBtn.disabled = false;
      }
    });

    row.append(name, valEl, revealBtn, copyBtn, delBtn);
    return row;
  }

  load();
  section.append(listEl, emptyEl, errEl, ce('hr', { className: 'ak-divider-line' }), addForm);
  return section;
}
