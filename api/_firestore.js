// Minimal Firestore REST access for the API routes (the browser pages use the Firebase SDK).
export const API_KEY = 'AIzaSyA5Qp3W1dcpd4ncnTyB68nMueXtHbAoLAk';
const KEY = API_KEY;
const BASE = 'https://firestore.googleapis.com/v1/projects/mangal-b11fe/databases/(default)/documents/';

export async function getDoc(path) {
  const res = await fetch(`${BASE}${path}?key=${KEY}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`firestore ${res.status}`);
  return res.json();
}

// Writes only the fields named in `mask`; a masked field missing from `fields` is deleted.
// With `existingOnly`, a refused write (missing doc, or the security rules said no) returns false instead of throwing.
export async function patchDoc(path, fields, mask, existingOnly) {
  const q = new URLSearchParams({ key: KEY });
  for (const m of mask) q.append('updateMask.fieldPaths', m);
  if (existingOnly) q.set('currentDocument.exists', 'true');
  const res = await fetch(`${BASE}${path}?${q}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    if (existingOnly) return false;
    throw new Error(`firestore ${res.status}`);
  }
  return true;
}
