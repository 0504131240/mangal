import { timingSafeEqual } from 'node:crypto';

const ADMIN_DOC_URL =
  'https://firestore.googleapis.com/v1/projects/mangal-b11fe/databases/(default)/documents/mangalSettings/admin' +
  '?key=AIzaSyA5Qp3W1dcpd4ncnTyB68nMueXtHbAoLAk';

export async function isAdmin(passHash) {
  if (typeof passHash !== 'string' || !/^[0-9a-f]{64}$/.test(passHash)) return false;
  const res = await fetch(ADMIN_DOC_URL);
  if (!res.ok) throw new Error(`admin lookup failed: firestore ${res.status}`);
  const stored = (await res.json())?.fields?.passHash?.stringValue;
  if (typeof stored !== 'string' || stored.length !== passHash.length) return false;
  return timingSafeEqual(Buffer.from(stored), Buffer.from(passHash));
}
