import { isAdmin } from './_auth.js';
import { getDoc, patchDoc } from './_firestore.js';
import { VAPID_PUBLIC_KEY, configured, sendToAll } from './_push.js';

const BOOKING_MAX_AGE_MS = 10 * 60 * 1000;

const num = (v) => Number(v?.integerValue ?? v?.doubleValue ?? 0);

function bookingText(f) {
  const name = (f.name?.stringValue || 'לקוח').slice(0, 40);
  const [y, m, d] = (f.date?.stringValue || '').split('-');
  const parts = [name, `${num(f.guests)} אנשים`];
  if (d) parts.push(`${d}/${m}/${y}`);
  if (f.washTime?.stringValue) parts.push(`נט"י ${f.washTime.stringValue}`);
  if (f.level?.stringValue) parts.push(f.level.stringValue);
  return parts.join(' · ');
}

export default async function handler(req, res) {
  if (req.method === 'GET') return res.status(200).json({ configured: configured(), publicKey: VAPID_PUBLIC_KEY });
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  if (!configured()) return res.status(503).json({ error: 'push-not-configured' });

  const { action, idToken, id } = req.body || {};
  try {
    if (action === 'test') {
      if (!(await isAdmin(idToken))) return res.status(401).json({ error: 'unauthorized' });
      const result = await sendToAll({ title: 'בדיקת התראות ✓', body: 'ההתראות עובדות. כך תיראה התראה על בקשת אירוע חדשה.', url: 'admin.html', tag: 'test' });
      return res.status(200).json(result);
    }

    if (action === 'booking') {
      if (typeof id !== 'string' || !/^[A-Za-z0-9]{10,40}$/.test(id)) return res.status(400).json({ error: 'bad id' });
      const doc = await getDoc(`mangalBookings/${id}`);
      if (!doc) return res.status(404).json({ error: 'not found' });
      const f = doc.fields || {};
      // only a fresh, pending request that hasn't been announced yet
      const fresh = Date.now() - Date.parse(doc.createTime) < BOOKING_MAX_AGE_MS;
      if (f.status?.stringValue !== 'pending' || f.notifiedAtMs || !fresh) return res.status(200).json({ skipped: true });
      // the security rules accept this mark only once, so two racing calls can't both send
      const claimed = await patchDoc(`mangalBookings/${id}`, { notifiedAtMs: { integerValue: String(Date.now()) } }, ['notifiedAtMs'], true);
      if (!claimed) return res.status(200).json({ skipped: true });
      const result = await sendToAll({ title: 'בקשת אירוע חדשה 🔥', body: bookingText(f), url: 'admin.html#pending', tag: `booking-${id}` });
      return res.status(200).json(result);
    }

    return res.status(400).json({ error: 'unknown action' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
