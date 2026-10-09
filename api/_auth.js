import { timingSafeEqual } from 'node:crypto';
import { getDoc } from './_firestore.js';

export async function isAdmin(passHash) {
  if (typeof passHash !== 'string' || !/^[0-9a-f]{64}$/.test(passHash)) return false;
  let doc;
  try {
    doc = await getDoc('mangalSettings/admin');
  } catch (err) {
    throw new Error(`admin lookup failed: ${err.message}`);
  }
  const stored = doc?.fields?.passHash?.stringValue;
  if (typeof stored !== 'string' || stored.length !== passHash.length) return false;
  return timingSafeEqual(Buffer.from(stored), Buffer.from(passHash));
}
