// tests/core/state.test.js — Unit tests for state machine
import { describe, it, expect, vi, beforeEach } from 'vitest';

// We need to import the actual module
// Since state.js uses module-level state, we need to be careful with re-imports
import { getState, dispatch, subscribe } from '../../core/state.js';

describe('core/state.js', () => {
  beforeEach(() => {
    // Reset state to initial by dispatching SIGN_OUT_COMPLETE
    dispatch({ type: 'SIGN_OUT_COMPLETE' });
  });

  describe('getState()', () => {
    it('should return initial state with status unauthenticated', () => {
      const state = getState();
      expect(state.status).toBe('unauthenticated');
      expect(state.user).toBeNull();
      expect(state.error).toBeNull();
    });
  });

  describe('dispatch()', () => {
    it('should transition to loading on INIT', () => {
      dispatch({ type: 'INIT' });
      expect(getState().status).toBe('loading');
    });

    it('should transition to authenticated on AUTH_SUCCESS', () => {
      const mockUser = { uid: '123', email: 'test@test.com' };
      dispatch({ type: 'AUTH_SUCCESS', user: mockUser });
      expect(getState().status).toBe('authenticated');
      expect(getState().user).toEqual(mockUser);
    });

    it('should transition to error on AUTH_FAILURE', () => {
      dispatch({ type: 'AUTH_FAILURE', error: 'Something went wrong' });
      expect(getState().status).toBe('error');
      expect(getState().error).toBe('Something went wrong');
    });

    it('should transition to loading on SIGN_OUT', () => {
      dispatch({ type: 'SIGN_OUT' });
      expect(getState().status).toBe('loading');
    });

    it('should transition to unauthenticated on SIGN_OUT_COMPLETE', () => {
      dispatch({ type: 'SIGN_OUT_COMPLETE' });
      expect(getState().status).toBe('unauthenticated');
      expect(getState().user).toBeNull();
    });

    it('should clear error on CLEAR_ERROR', () => {
      dispatch({ type: 'AUTH_FAILURE', error: 'bad' });
      expect(getState().error).toBe('bad');
      dispatch({ type: 'CLEAR_ERROR' });
      expect(getState().error).toBeNull();
    });

    it('should set pendingProvider on PROVIDER_START', () => {
      dispatch({ type: 'PROVIDER_START', providerId: 'google' });
      expect(getState().pendingProvider).toBe('google');
      expect(getState().status).toBe('loading');
    });
  });

  describe('subscribe()', () => {
    it('should immediately call callback with current state', () => {
      const cb = vi.fn();
      subscribe(cb);
      expect(cb).toHaveBeenCalledOnce();
      expect(cb.mock.calls[0][0].status).toBe('unauthenticated');
    });

    it('should return an unsubscribe function', () => {
      const cb = vi.fn();
      const unsub = subscribe(cb);
      expect(typeof unsub).toBe('function');
      unsub();
    });

    it('should stop receiving updates after unsubscribe', () => {
      const cb = vi.fn();
      const unsub = subscribe(cb);
      cb.mockClear();
      unsub();
      dispatch({ type: 'INIT' });
      expect(cb).not.toHaveBeenCalled();
    });

    it('should notify subscribers on state changes', () => {
      const cb = vi.fn();
      subscribe(cb);
      cb.mockClear();
      dispatch({ type: 'INIT' });
      expect(cb).toHaveBeenCalled();
    });
  });
});