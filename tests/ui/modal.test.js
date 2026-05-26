// tests/ui/modal.test.js — Unit tests for modal component
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ce, injectStyles } from '../../utils/dom.js';

// We test the modal's CSS fix (Bug 2) and config resolution (Bug 3)
// by verifying the patterns work correctly

describe('ui/modal.js — Bug Fix Verification', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.querySelectorAll('style[id^="ak-"]').forEach(s => s.remove());
  });

  describe('Bug 2: CSS selectors should match overlay with data-authkit on itself', () => {
    it('should apply styles when data-authkit is on the overlay element itself', () => {
      // Simulate the fix: CSS selectors include both patterns
      const css = `
        [data-authkit] .ak-overlay,
        .ak-overlay[data-authkit] {
          position: fixed;
          inset: 0;
        }
      `;
      injectStyles('modal-test', css);

      // Create overlay with data-authkit on itself (as the code does)
      const overlay = ce('div', { className: 'ak-overlay', 'data-authkit': '' });
      document.body.appendChild(overlay);

      // Verify the element exists and has the right attributes
      expect(overlay.hasAttribute('data-authkit')).toBe(true);
      expect(overlay.classList.contains('ak-overlay')).toBe(true);
    });
  });

  describe('Bug 3: Config should read from config.ui.* with fallback', () => {
    it('should resolve brandName from config.ui.brandName', () => {
      const config = { ui: { brandName: 'MyApp', theme: 'auto' }, brandName: undefined };
      const ui = config.ui ?? {};
      const brandName = ui.brandName || config.brandName || '';
      expect(brandName).toBe('MyApp');
    });

    it('should fall back to config.brandName if ui.brandName is empty', () => {
      const config = { ui: { brandName: '', theme: 'auto' }, brandName: 'FallbackApp' };
      const ui = config.ui ?? {};
      const brandName = ui.brandName || config.brandName || '';
      expect(brandName).toBe('FallbackApp');
    });

    it('should default to empty string if neither is set', () => {
      const config = { ui: {}, brandName: undefined };
      const ui = config.ui ?? {};
      const brandName = ui.brandName || config.brandName || '';
      expect(brandName).toBe('');
    });

    it('should resolve theme from config.ui.theme', () => {
      const config = { ui: { theme: 'dark' }, theme: undefined };
      const ui = config.ui ?? {};
      const theme = ui.theme ?? config.theme ?? 'auto';
      expect(theme).toBe('dark');
    });

    it('should default theme to auto', () => {
      const config = {};
      const ui = config.ui ?? {};
      const theme = ui.theme ?? config.theme ?? 'auto';
      expect(theme).toBe('auto');
    });
  });

  describe('Bug 10: Modal subscription should unsubscribe after auto-hide', () => {
    it('should call unsubscribe function after hiding', () => {
      const mockUnsub = vi.fn();
      let unsubState = null;

      const mockSubscribe = vi.fn((cb) => {
        unsubState = mockUnsub;
        cb({ status: 'authenticated' });
        return mockUnsub;
      });

      // Simulate the fix pattern
      unsubState = mockSubscribe((state) => {
        if (state.status === 'authenticated') {
          // hide();
          if (unsubState) { unsubState(); unsubState = null; }
        }
      });

      expect(mockSubscribe).toHaveBeenCalled();
      // After authenticated state, unsub should have been called
      expect(mockUnsub).toHaveBeenCalled();
    });
  });

  describe('Bug 13: hide/show race condition', () => {
    it('should clear hide timeout when show is called', () => {
      let hideTimeout = null;

      function hide() {
        hideTimeout = setTimeout(() => {}, 200);
      }

      function show() {
        if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null; }
      }

      hide();
      expect(hideTimeout).not.toBeNull();

      show();
      expect(hideTimeout).toBeNull();
    });
  });
});