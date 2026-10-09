import { BASE } from './_firestore.js';

// The admins list is readable only by admins (the owners named in the security rules plus the
// emails in mangalSettings/admins), so reading it with the caller's Firebase ID token is the check.
export async function isAdmin(idToken) {
  if (typeof idToken !== 'string' || idToken.length < 100) return false;
  const res = await fetch(`${BASE}mangalSettings/admins`, { headers: { authorization: `Bearer ${idToken}` } });
  if (res.ok || res.status === 404) return true; // 404: allowed to read, list not created yet
  if (res.status === 400 || res.status === 401 || res.status === 403) return false; // malformed / invalid token, or not an admin
  throw new Error(`admin check failed: firestore ${res.status}`);
}
