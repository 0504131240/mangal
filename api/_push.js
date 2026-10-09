import webpush from 'web-push';
import { getDoc } from './_firestore.js';

export const VAPID_PUBLIC_KEY = 'BB5gbFkt0YrnB7jAywT5CWmMntuj8S0mt5oe3khYuHitM5YRzGOtYTAOD0KLkVJvUT08_c5fCfQUgWcJcIVgfSQ';
const SITE = 'https://mangal-belahavot.vercel.app';

export const configured = () => Boolean(process.env.VAPID_PRIVATE_KEY);

// Sends one notification to every device that turned on notifications in the admin settings.
export async function sendToAll(payload) {
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
