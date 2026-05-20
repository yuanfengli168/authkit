// providers/email.js — Email + Password provider

const FB_SDK = 'https://www.gstatic.com/firebasejs/10.12.0';

export const EMAIL_ERRORS = {
  'auth/invalid-email':          'Invalid email address.',
  'auth/user-not-found':         'No account found with that email.',
  'auth/wrong-password':         'Incorrect password.',
  'auth/invalid-credential':     'Invalid email or password.',
  'auth/email-already-in-use':   'An account with this email already exists.',
  'auth/weak-password':          'Password must be at least 6 characters.',
  'auth/too-many-requests':      'Too many attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Check your connection.',
  'auth/operation-not-allowed':  'Email/password auth is not enabled. Check Firebase Console.',
  'auth/requires-recent-login':  'Please sign in again to complete this action.',
};

export function friendlyError(err) {
  return EMAIL_ERRORS[err.code] ?? err.message ?? 'Authentication failed.';
}

export default {
  id: 'email',
  label: 'Continue with Email',
  icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m2 7 10 6 10-6"/>
  </svg>`,
  canLink: false,

  async signIn(auth, { email, password }) {
    const { signInWithEmailAndPassword } = await import(`${FB_SDK}/firebase-auth.js`);
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  },

  async signUp(auth, { email, password }) {
    const { createUserWithEmailAndPassword } = await import(`${FB_SDK}/firebase-auth.js`);
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return cred.user;
  },

  async resetPassword(auth, { email }) {
    const { sendPasswordResetEmail } = await import(`${FB_SDK}/firebase-auth.js`);
    await sendPasswordResetEmail(auth, email);
  },
};
