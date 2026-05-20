// demo/demo.js
// Shared demo initialization logic
// This module is loaded by both index.html and settings.html

// Replace firebaseConfig with your own project config from Firebase Console
// https://console.firebase.google.com/
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
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
