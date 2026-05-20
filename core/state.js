// core/state.js — Minimal reactive auth state machine

/**
 * States: unauthenticated | loading | authenticated | error
 * Actions: INIT, AUTH_SUCCESS, AUTH_FAILURE, SIGN_OUT, SIGN_OUT_COMPLETE, CLEAR_ERROR, PROVIDER_START
 */

const INITIAL_STATE = {
  status: 'unauthenticated',
  user: null,
  error: null,
  pendingProvider: null,
};

let _state = { ...INITIAL_STATE };
const _subscribers = new Set();

function reduce(state, action) {
  switch (action.type) {
    case 'INIT':
      return { ...state, status: 'loading', error: null };
    case 'PROVIDER_START':
      return { ...state, status: 'loading', error: null, pendingProvider: action.providerId ?? null };
    case 'AUTH_SUCCESS':
      return { ...INITIAL_STATE, status: 'authenticated', user: action.user };
    case 'AUTH_FAILURE':
      return { ...state, status: 'error', error: action.error, pendingProvider: null };
    case 'SIGN_OUT':
      return { ...state, status: 'loading' };
    case 'SIGN_OUT_COMPLETE':
      return { ...INITIAL_STATE, status: 'unauthenticated' };
    case 'CLEAR_ERROR':
      return { ...state, error: null, status: state.user ? 'authenticated' : 'unauthenticated' };
    default:
      return state;
  }
}

export function getState() {
  return { ..._state };
}

export function dispatch(action) {
  const next = reduce(_state, action);
  if (next === _state) return;
  _state = next;
  for (const fn of _subscribers) {
    try { fn({ ..._state }); } catch (e) { console.error('[AuthKit] subscriber error', e); }
  }
}

export function subscribe(fn) {
  _subscribers.add(fn);
  // Immediately call with current state
  fn({ ..._state });
  return () => _subscribers.delete(fn);
}
