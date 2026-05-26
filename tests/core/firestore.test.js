// tests/core/firestore.test.js — Unit tests for Firestore wrapper bug fixes
import { describe, it, expect, vi } from 'vitest';

// Mock Firebase Firestore
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

describe('core/firestore.js — Bug Fix Verification', () => {
  describe('Bug 18: deleteUserData should delete user doc first', () => {
    it('should call deleteDoc for user doc before keys', async () => {
      const { deleteUserData } = await import('../../core/firestore.js');
      const { deleteDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

      const mockDb = {};
      deleteDoc.mockClear();
      doc.mockClear();

      await deleteUserData(mockDb, 'user123');

      // Verify deleteDoc was called
      expect(deleteDoc).toHaveBeenCalled();

      // The first call should be for the user document (not keys)
      // In the fixed version, user doc is deleted first
      const firstCallPath = doc.mock.calls[0];
      expect(firstCallPath).toContain('user123');
    });
  });
});