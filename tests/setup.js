// tests/setup.js — Global test setup
// Mock Firebase SDK modules so tests don't need real Firebase
import { vi } from 'vitest';

// ── Mock Firebase Auth ────────────────────────────────────────────────────────
const mockAuth = {
  currentUser: null,
  onAuthStateChanged: vi.fn((cb) => {
    cb(null); // default: no user
    return vi.fn(); // unsubscribe
  }),
};

const mockApp = { name: 'authkit', options: {} };

vi.mock('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js', () => ({
  initializeApp: vi.fn(() => mockApp),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => mockApp),
}));

vi.mock('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js', () => ({
  getAuth: vi.fn(() => mockAuth),
  browserLocalPersistence: {},
  setPersistence: vi.fn(() => Promise.resolve()),
  onAuthStateChanged: vi.fn((auth, cb) => {
    cb(null);
    return vi.fn();
  }),
  getRedirectResult: vi.fn(() => Promise.resolve(null)),
  signInWithPopup: vi.fn(),
  signInWithRedirect: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  signOut: vi.fn(() => Promise.resolve()),
  GoogleAuthProvider: vi.fn(),
  linkWithPopup: vi.fn(),
  unlink: vi.fn(),
  updateProfile: vi.fn(),
}));

vi.mock('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn((db, ...path) => ({ path: path.join('/') })),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => false, data: () => null })),
  setDoc: vi.fn(() => Promise.resolve()),
  collection: vi.fn((db, ...path) => ({ path: path.join('/') })),
  addDoc: vi.fn(() => Promise.resolve({ id: 'mock-key-id' })),
  getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
  query: vi.fn((ref) => ref),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
  updateDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
}));