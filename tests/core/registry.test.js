// tests/core/registry.test.js — Unit tests for provider registry
import { describe, it, expect, vi, beforeEach } from 'vitest';

// We can't easily test dynamic imports in vitest without a server,
// so we test the registerProvider and listLoaded functions
import { registerProvider, listLoaded } from '../../core/registry.js';

describe('core/registry.js', () => {
  beforeEach(() => {
    // Clear loaded providers by re-importing... since registry uses module-level
    // state, we test what we can
  });

  describe('registerProvider()', () => {
    it('should register a valid provider module', () => {
      const mockProvider = {
        id: 'test-provider',
        label: 'Test Provider',
        icon: '<span>Test</span>',
        signIn: vi.fn(),
      };
      expect(() => registerProvider(mockProvider)).not.toThrow();
    });

    it('should throw if provider module has no id', () => {
      expect(() => registerProvider({})).toThrow('[AuthKit] Provider module must have an `id` field');
    });

    it('should throw if provider module is null', () => {
      expect(() => registerProvider(null)).toThrow();
    });
  });

  describe('listLoaded()', () => {
    it('should return registered providers', () => {
      const mockProvider = {
        id: 'test-list-provider',
        label: 'Test List Provider',
        icon: '<span>Test</span>',
        signIn: vi.fn(),
      };
      registerProvider(mockProvider);
      const loaded = listLoaded();
      const found = loaded.find(p => p.id === 'test-list-provider');
      expect(found).toBeDefined();
      expect(found.id).toBe('test-list-provider');
    });
  });
});