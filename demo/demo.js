// demo/demo.js
// Shared demo initialization logic
// This module is loaded by both index.html and settings.html

// Replace firebaseConfig with your own project config from Firebase Console
// https://console.firebase.google.com/
export const firebaseConfig = {
  apiKey: "AIzaSyAftuF-eDxWOdIBrHvFE50Qt8X7F9XvLFQ",
  authDomain: "ai-idea-generator-d9e15.firebaseapp.com",
  projectId: "ai-idea-generator-d9e15",
  storageBucket: "ai-idea-generator-d9e15.firebasestorage.app",
  messagingSenderId: "997919258193",
  appId: "1:997919258193:web:8c1ad1f323a82b683faa70"
};

export const authkitConfig = {
  firebase: firebaseConfig,
  enabledProviders: ['google', 'email'],
  loginMode: 'inline',
  theme: 'auto',
  brandName: 'My App',
  brandEmoji: '🚀',
  loginTitle: 'Welcome to My App',
  loginSubtitle: 'Sign in to get started',
  googleAuthMode: 'popup',
  baseUrl: '../',
  afterLogout: 'index.html',
  callbacks: {
    afterLogin: () => console.log('[AuthKit Demo] User signed in successfully'),
  },
  settings: {
    enableSavedKeys: true,
    keysCollection: 'savedKeys',
  },
};
