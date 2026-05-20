# AuthKit

A drop-in Firebase authentication component for static web apps. No build step, no bundler, pure ES Modules.

🔗 **Live Demo:** https://yuanfengli168.github.io/authkit/demo/
📦 **Repo:** https://github.com/yuanfengli168/authkit

## What is AuthKit?

AuthKit is a lightweight, self-contained authentication library built on Firebase Auth. It provides:

- 🔐 **Google OAuth** (popup or redirect)
- 📧 **Email/password** (sign in, sign up, password reset)
- 🎨 **Inline or modal** login UI
- ⚙️ **Account settings page** (profile, linked accounts, saved keys, danger zone)
- 🔑 **Saved API keys** stored in Firestore
- 🌗 **Light/dark/auto theming**
- 🧩 **Extensible provider system**

It works directly from a CDN — just import it and call `AuthKit.init()`.

---

## Quick Start

```html
<!-- In your HTML -->
<div id="auth-anchor"></div>

<script type="module">
  import AuthKit from 'https://your-cdn.example.com/authkit/index.js';

  await AuthKit.init({
    firebase: {
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_PROJECT.firebaseapp.com",
      projectId: "YOUR_PROJECT_ID",
      storageBucket: "YOUR_PROJECT.appspot.com",
      messagingSenderId: "YOUR_SENDER_ID",
      appId: "YOUR_APP_ID"
    },
    enabledProviders: ['google', 'email'],
    anchor: '#auth-anchor',
    loginMode: 'inline',
    brandName: 'My App',
    baseUrl: 'https://your-cdn.example.com/authkit/',
  });

  AuthKit.onAuthStateChanged((user) => {
    if (user) {
      console.log('Signed in as', user.displayName);
    } else {
      console.log('Not signed in');
    }
  });
</script>
```

---

## Configuration Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `firebase` | `object` | **required** | Firebase project configuration object |
| `enabledProviders` | `string[]` | **required** | List of provider IDs: `['google', 'email']` |
| `anchor` | `string \| Element` | **required** | CSS selector or DOM element for the login panel |
| `loginMode` | `'modal' \| 'inline'` | `'modal'` | How to display the login UI |
| `googleAuthMode` | `'popup' \| 'redirect'` | `'popup'` | Google sign-in flow type |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'auto'` | UI color theme |
| `autoShow` | `boolean` | `true` | Auto-show login when user is unauthenticated (inline mode) |
| `brandName` | `string` | `''` | App name shown in the login UI |
| `brandEmoji` | `string` | `null` | Emoji shown as logo in login UI |
| `logoUrl` | `string` | `null` | URL of logo image |
| `loginTitle` | `string` | `null` | Custom title for login panel |
| `loginSubtitle` | `string` | `null` | Custom subtitle for login panel |
| `afterLogout` | `string` | `'/'` | URL to redirect to after sign out |
| `baseUrl` | `string` | auto-detected | Base URL for loading provider modules |
| `callbacks.afterLogin` | `function \| string` | `null` | Called or redirected to after sign in |
| `settings.enableSavedKeys` | `boolean` | `true` | Show saved API keys section on settings page |
| `settings.keysCollection` | `string` | `'savedKeys'` | Firestore subcollection name for saved keys |

---

## Provider System

AuthKit uses a dynamic provider loader. Built-in providers: `google`, `email`.

### Adding a Custom Provider

Create a provider module:

```js
// providers/github.js
import { GithubAuthProvider, signInWithPopup } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

export default {
  id: 'github',
  label: 'Continue with GitHub',
  icon: '🐙',
  canLink: true,

  async signIn(auth, opts = {}) {
    const provider = new GithubAuthProvider();
    return signInWithPopup(auth, provider);
  },

  async linkAccount(auth) {
    const provider = new GithubAuthProvider();
    return linkWithPopup(auth.currentUser, provider);
  },

  async unlinkAccount(user) {
    return unlink(user, GithubAuthProvider.PROVIDER_ID);
  },
};
```

Register at runtime:

```js
import githubProvider from './providers/github.js';
AuthKit.registerProvider(githubProvider);
```

Or include `'github'` in `enabledProviders` (AuthKit will load it from `baseUrl/providers/github.js`).

---

## Settings Page Setup

Add a container and call `renderSettings`:

```html
<div id="settings-container"></div>

<script type="module">
  import AuthKit from '../index.js';
  await AuthKit.init({ /* ... config ... */ });
  AuthKit.renderSettings('#settings-container');
</script>
```

The settings page renders:
1. **Profile** — edit display name and photo URL
2. **Connected Accounts** — link/unlink OAuth providers
3. **Saved Keys** — store and manage API keys in Firestore
4. **Account Actions** — sign out, delete account

---

## Theming

AuthKit uses CSS custom properties scoped to `[data-authkit]`. Override any variable:

```css
[data-authkit] {
  --ak-color-primary: #7C3AED;
  --ak-color-primary-hover: #6D28D9;
  --ak-modal-width: 480px;
  --ak-btn-radius: 24px;
}
```

| Variable | Default | Description |
|----------|---------|-------------|
| `--ak-color-primary` | `#4F46E5` | Primary accent color |
| `--ak-color-primary-hover` | `#4338CA` | Primary color on hover |
| `--ak-color-primary-text` | `#FFFFFF` | Text on primary buttons |
| `--ak-color-bg` | `#FFFFFF` | Background color |
| `--ak-color-bg-subtle` | `#F9FAFB` | Subtle background |
| `--ak-color-surface` | `#FFFFFF` | Card/surface background |
| `--ak-color-border` | `#E5E7EB` | Border color |
| `--ak-color-text` | `#111827` | Primary text |
| `--ak-color-text-secondary` | `#6B7280` | Secondary text |
| `--ak-color-error` | `#DC2626` | Error color |
| `--ak-color-success` | `#16A34A` | Success color |
| `--ak-modal-width` | `400px` | Modal dialog width |
| `--ak-btn-height` | `44px` | Button height |
| `--ak-btn-radius` | `8px` | Button border radius |
| `--ak-font-family` | `system-ui` | Font family |
| `--ak-z-overlay` | `1000` | Overlay z-index |
| `--ak-z-modal` | `1001` | Modal z-index |

Dark mode variables override light defaults when `data-theme="dark"` is set.

---

## Auth Guard

Use `requireAuth()` to protect pages or actions:

```js
// Guard a page — shows login and resolves when user authenticates
const user = await AuthKit.requireAuth();
console.log('Authenticated as', user.uid);

// Or protect an action
document.querySelector('#premium-btn').addEventListener('click', async () => {
  const user = await AuthKit.requireAuth();
  // proceed with action
});
```

---

## Public API Reference

| Method | Description |
|--------|-------------|
| `AuthKit.init(config)` | Initialize AuthKit. Returns `Promise<AuthKit>`. |
| `AuthKit.requireAuth(opts?)` | Waits for authentication. Returns `Promise<User>`. |
| `AuthKit.renderSettings(selector)` | Renders the settings panel into a container. |
| `AuthKit.onAuthStateChanged(cb)` | Subscribe to auth state changes. Returns unsubscribe fn. |
| `AuthKit.currentUser` | (getter) Current Firebase User or `null`. |
| `AuthKit.signOut()` | Signs out the user. Returns `Promise<void>`. |
| `AuthKit.showLogin()` | Opens the modal or shows the inline panel. |
| `AuthKit.hideLogin()` | Closes/hides the login UI. |
| `AuthKit.registerProvider(module)` | Registers a custom provider module at runtime. |

---

## Firestore Setup & Security Rules

AuthKit stores user data at `users/{uid}` with a `savedKeys` subcollection.

### Enable Firestore

1. Go to [Firebase Console](https://console.firebase.google.com/) → Firestore Database
2. Create a database in production mode
3. Deploy the security rules below

### Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /savedKeys/{keyId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /{subcollection}/{docId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## Static Deployment Notes

AuthKit is designed for **no-build-step** static deployments:

- **Source IS distribution** — no `dist/` folder needed. Deploy the whole `authkit/` directory.
- **CDN-friendly** — all Firebase imports use `https://www.gstatic.com/firebasejs/10.12.0/` URLs.
- **ES Modules only** — requires a browser that supports ES Modules (all modern browsers).
- **HTTPS required** — Firebase Auth requires HTTPS in production. For local dev, use `http://localhost`.
- **Set `baseUrl`** — when deploying, set `baseUrl` to the URL where `authkit/` is hosted so providers can be dynamically imported.

### Example: GitHub Pages

```js
await AuthKit.init({
  // ...
  baseUrl: 'https://yourname.github.io/your-repo/authkit/',
});
```

### Authorized Domains

Add your deployed domain to Firebase Console → Authentication → Settings → Authorized Domains.
