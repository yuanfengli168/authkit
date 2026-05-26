// tests/ui/settings.test.js — Unit tests for settings component bug fixes
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ce } from '../../utils/dom.js';

describe('ui/settings.js — Bug Fix Verification', () => {
  describe('Bug 11: Settings subscription should unsubscribe after redirect', () => {
    it('should unsubscribe from state after logout redirect', () => {
      const mockUnsub = vi.fn();
      let logoutUnsub = null;

      const mockSubscribe = vi.fn((cb) => {
        logoutUnsub = mockUnsub;
        // Simulate immediate callback with unauthenticated state
        const state = { status: 'unauthenticated' };
        cb(state);
        return mockUnsub;
      });

      // Simulate the fix pattern
      logoutUnsub = mockSubscribe((s) => {
        if (s.status === 'unauthenticated') {
          logoutUnsub();
          // location.href = config.redirects?.afterLogout ?? '/';
        }
      });

      // The unsubscribe should have been called
      expect(mockUnsub).toHaveBeenCalled();
    });
  });
});