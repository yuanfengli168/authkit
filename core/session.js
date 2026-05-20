// core/session.js — Firebase auth wiring, persistence, token refresh

import { dispatch } from './state.js';
import { handlePostLoginRedirect } from '../utils/redirect.js';

const FB_SDK = 'https://www.gstatic.com/firebasejs/10.12.0';

let _auth = null;
let _app  = null;

export async function initSession(firebaseConfig, callbacks = {}, googleAuthMode = 'popup') {
  const { initializeApp, getApps, getApp } =
    await import(`${FB_SDK}/firebase-app.js`);

  // Use named instance to avoid colliding with host app's Firebase instance
  const existingApps = getApps();
  const existingAuthkit = existingApps.find(a => a.name === 'authkit');
  _app = existingAuthkit ?? initializeApp(firebaseConfig, 'authkit');

  const {
    getAuth,
    browserLocalPersistence,
    setPersistence,
    onAuthStateChanged,
    getRedirectResult,
  } = await import(`${FB_SDK}/firebase-auth.js`);

  _auth = getAuth(_app);

  try {
    await setPersistence(_auth, browserLocalPersistence);
  } catch { /* ignore — may already be set */ }

  // Handle returning redirect (if popup isn't available / was forced to redirect)
  if (googleAuthMode === 'redirect') {
    try {
      const result = await getRedirectResult(_auth);
      if (result?.user) {
        dispatch({ type: 'AUTH_SUCCESS', user: serializeUser(result.user) });
        handlePostLoginRedirect(callbacks.afterLogin);
      }
    } catch (err) {
      dispatch({ type: 'AUTH_FAILURE', error: err.message });
    }
  }

  // Wire persistent auth state listener
  onAuthStateChanged(_auth, (firebaseUser) => {
    if (firebaseUser) {
      const user = serializeUser(firebaseUser);
      dispatch({ type: 'AUTH_SUCCESS', user });
      if (typeof callbacks.onLogin === 'function') callbacks.onLogin(user);
    } else {
      dispatch({ type: 'SIGN_OUT_COMPLETE' });
      if (typeof callbacks.onLogout === 'function') callbacks.onLogout();
    }
  });
}

export function getAuth_() { return _auth; }
export function getApp_()  { return _app; }

function serializeUser(u) {
  return {
    uid:         u.uid,
    email:       u.email,
    displayName: u.displayName,
    photoURL:    u.photoURL,
    providers:   u.providerData.map(p => p.providerId),
    _raw:        u, // keep raw ref for SDK calls
  };
}
