// Minimal Firestore REST access for the API routes (the browser pages use the Firebase SDK).
const KEY = 'AIzaSyA5Qp3W1dcpd4ncnTyB68nMueXtHbAoLAk';
const BASE = 'https://firestore.googleapis.com/v1/projects/mangal-b11fe/databases/(default)/documents/';

export async function getDoc(path) {
  const res = await fetch(`${BASE}${path}?key=${KEY}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`firestore ${res.status}`);
  return res.json();
}

// Writes only the fields named in `mask`; a masked field missing from `fields` is deleted.
// With `updateTime`, the write only succeeds if the doc is unchanged since it was read (returns false otherwise).
export async function patchDoc(path, fields, mask, updateTime) {
  const q = new URLSearchParams({ key: KEY });
  for (const m of mask) q.append('updateMask.fieldPaths', m);
  if (updateTime) q.set('currentDocument.updateTime', updateTime);
  const res = await fetch(`${BASE}${path}?${q}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    if (updateTime) return false;
    throw new Error(`firestore ${res.status}`);
  }
  return true;
}
