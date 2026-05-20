// utils/redirect.js — Post-login redirect helpers

const KEY = 'ak_redirect';

export function setPostLoginRedirect(url) {
  try { sessionStorage.setItem(KEY, url); } catch { /* ignore */ }
}

export function getPostLoginRedirect() {
  try { return sessionStorage.getItem(KEY); } catch { return null; }
}

export function clearPostLoginRedirect() {
  try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
}

/**
 * If a redirect is pending, navigate to it (same-origin only).
 * Falls back to `defaultUrl`. Returns true if redirect occurred.
 */
export function handlePostLoginRedirect(defaultUrl = '/') {
  const pending = getPostLoginRedirect();
  clearPostLoginRedirect();
  try {
    if (pending) {
      const url = new URL(pending, location.origin);
      if (url.origin === location.origin) {
        location.href = url.pathname + url.search + url.hash;
        return true;
      }
    }
    if (defaultUrl && defaultUrl !== location.pathname) {
      location.href = defaultUrl;
      return true;
    }
  } catch { /* malformed URL — ignore */ }
  return false;
}
