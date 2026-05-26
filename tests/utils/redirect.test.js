// tests/utils/redirect.test.js — Unit tests for redirect helpers
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock sessionStorage
const mockStorage = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, val) => { store[key] = val; }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: () => { store = {}; },
  };
})();

// Override global sessionStorage
Object.defineProperty(globalThis, 'sessionStorage', { value: mockStorage });

import { setPostLoginRedirect, getPostLoginRedirect, clearPostLoginRedirect, handlePostLoginRedirect } from '../../utils/redirect.js';

describe('utils/redirect.js', () => {
  beforeEach(() => {
    mockStorage.clear();
    vi.clearAllMocks();
  });

  describe('setPostLoginRedirect()', () => {
    it('should store the redirect URL in sessionStorage', () => {
      setPostLoginRedirect('/dashboard');
      expect(mockStorage.setItem).toHaveBeenCalledWith('ak_redirect', '/dashboard');
    });
  });

  describe('getPostLoginRedirect()', () => {
    it('should retrieve the redirect URL from sessionStorage', () => {
      setPostLoginRedirect('/dashboard');
      const result = getPostLoginRedirect();
      expect(result).toBe('/dashboard');
    });

    it('should return null if no redirect is set', () => {
      const result = getPostLoginRedirect();
      expect(result).toBeNull();
    });
  });

  describe('clearPostLoginRedirect()', () => {
    it('should remove the redirect URL from sessionStorage', () => {
      setPostLoginRedirect('/dashboard');
      clearPostLoginRedirect();
      expect(mockStorage.removeItem).toHaveBeenCalledWith('ak_redirect');
    });
  });

  describe('handlePostLoginRedirect()', () => {
    it('should return false if no redirect is pending and no defaultUrl', () => {
      const result = handlePostLoginRedirect(null);
      expect(result).toBe(false);
    });
  });
});