// index.js — Public entry point

export { AuthKit } from './core/authkit.js';
export default (await import('./core/authkit.js')).AuthKit;

if (typeof window !== 'undefined') {
  import('./core/authkit.js').then(m => { window.AuthKit = m.AuthKit; });
}
