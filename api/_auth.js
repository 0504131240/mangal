import { getDoc, API_KEY } from './_firestore.js';

// True when idToken is a valid Firebase sign-in token of the admin account named in mangalSettings/admin.
export async function isAdmin(idToken) {
  if (typeof idToken !== 'string' || idToken.length < 100) return false;
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (res.status === 400) return false; // expired or forged token
  if (!res.ok) throw new Error(`admin lookup failed: auth ${res.status}`);
  const uid = (await res.json()).users?.[0]?.localId;
  let doc;
  try {
    doc = await getDoc('mangalSettings/admin');
  } catch (err) {
    throw new Error(`admin lookup failed: ${err.message}`);
  }
  const adminUid = doc?.fields?.authUid?.stringValue;
  return Boolean(uid && adminUid && uid === adminUid);
}
