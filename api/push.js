import webpush from 'web-push';
import { isAdmin } from './_auth.js';
import { getDoc, patchDoc } from './_firestore.js';

const VAPID_PUBLIC_KEY = 'BB5gbFkt0YrnB7jAywT5CWmMntuj8S0mt5oe3khYuHitM5YRzGOtYTAOD0KLkVJvUT08_c5fCfQUgWcJcIVgfSQ';
const SITE = 'https://mangal-belahavot.vercel.app';
const BOOKING_MAX_AGE_MS = 10 * 60 * 1000;

const configured = () => Boolean(process.env.VAPID_PRIVATE_KEY);
const num = (v) => Number(v?.integerValue ?? v?.doubleValue ?? 0);

async function sendToAll(payload) {
  webpush.setVapidDetails(SITE, VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY.trim());
  const doc = await getDoc('mangalSettings/push');
  const subs = Object.entries(doc?.fields?.subs?.mapValue?.fields || {});
  let sent = 0;
  let gone = 0;
  const errors = [];
  await Promise.all(subs.map(async ([, v]) => {
    const f = v.mapValue?.fields || {};
    const sub = { endpoint: f.endpoint?.stringValue, keys: { p256dh: f.p256dh?.stringValue, auth: f.auth?.stringValue } };
    if (!sub.endpoint) return;
    try {
      await webpush.sendNotification(sub, JSON.stringify(payload), { TTL: 86400, urgency: 'high' });
      sent++;
    } catch (err) {
      // 404/410: the browser dropped this subscription; the admin's device re-registers itself on its next open
      if (err.statusCode === 404 || err.statusCode === 410) gone++;
      else errors.push(`${err.statusCode || ''} ${err.body || err.message}`.trim());
    }
  }));
  return { sent, devices: subs.length, gone, errors };
}

function bookingText(f) {
  const name = (f.name?.stringValue || 'לקוח').slice(0, 40);
  const [y, m, d] = (f.date?.stringValue || '').split('-');
  const parts = [name, `${num(f.guests)} אנשים`];
  if (d) parts.push(`${d}/${m}/${y}`);
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
