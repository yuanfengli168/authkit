// core/firestore.js — Lazy Firestore wrapper

const FB_SDK = 'https://www.gstatic.com/firebasejs/10.12.0';

let _db = null;

export async function getFirestoreClient(app) {
  if (_db) return _db;
  const { getFirestore } = await import(`${FB_SDK}/firebase-firestore.js`);
  _db = getFirestore(app);
  return _db;
}

// ── User document ─────────────────────────────────────────────────────────────

export async function getUserDoc(db, uid) {
  const { doc, getDoc } = await import(`${FB_SDK}/firebase-firestore.js`);
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

export async function setUserDoc(db, uid, data) {
  const { doc, setDoc } = await import(`${FB_SDK}/firebase-firestore.js`);
  await setDoc(doc(db, 'users', uid), data, { merge: true });
}

// ── Saved keys (subcollection users/{uid}/keys/{keyId}) ───────────────────────

export async function getSavedKeys(db, uid) {
  const { collection, getDocs, query, orderBy } = await import(`${FB_SDK}/firebase-firestore.js`);
  const q = query(collection(db, 'users', uid, 'keys'), orderBy('createdAt', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function saveKey(db, uid, { name, value }) {
  const { collection, addDoc, serverTimestamp } = await import(`${FB_SDK}/firebase-firestore.js`);
  return addDoc(collection(db, 'users', uid, 'keys'), {
    name,
    value,
    createdAt: serverTimestamp(),
  });
}

export async function updateKey(db, uid, keyId, data) {
  const { doc, updateDoc } = await import(`${FB_SDK}/firebase-firestore.js`);
  await updateDoc(doc(db, 'users', uid, 'keys', keyId), data);
}

export async function deleteKey(db, uid, keyId) {
  const { doc, deleteDoc } = await import(`${FB_SDK}/firebase-firestore.js`);
  await deleteDoc(doc(db, 'users', uid, 'keys', keyId));
}

// ── Account deletion ──────────────────────────────────────────────────────────

export async function deleteUserData(db, uid) {
  const {
    doc, deleteDoc, collection, getDocs,
  } = await import(`${FB_SDK}/firebase-firestore.js`);

  // Bug 18 fix: delete user document first, then keys (so if keys deletion fails,
  // the user doc is already gone and the account is effectively deleted)
  await deleteDoc(doc(db, 'users', uid));

  // Best-effort deletion of saved keys
  try {
    const keysSnap = await getDocs(collection(db, 'users', uid, 'keys'));
    await Promise.all(keysSnap.docs.map(d => deleteDoc(d.ref)));
  } catch {
    // Keys may already be inaccessible if the user doc is gone; that's acceptable
  }
}
