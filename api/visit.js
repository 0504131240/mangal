// Counts a visitor's source, device and area for the admin's "כניסות" tab (mangalVisitInfo/{Israel date}).
// The area comes from Vercel's location headers (by the visitor's internet address); only the counts are saved.
const KEY = 'AIzaSyA5Qp3W1dcpd4ncnTyB68nMueXtHbAoLAk';
const DB = 'projects/mangal-b11fe/databases/(default)/documents';

const SOURCES = ['direct', 'wa', 'ig', 'fb', 'search', 'tiktok', 'other'];
const DEVICES = ['mobile', 'tablet', 'desktop'];
// Israel's districts by their ISO codes
const DISTRICTS = { JM: 'jm', TA: 'ta', HA: 'ha', M: 'm', Z: 'z', D: 'd' };

function area(headers) {
  const country = String(headers['x-vercel-ip-country'] || '').toUpperCase();
  const region = String(headers['x-vercel-ip-country-region'] || '').toUpperCase();
  if (!country) return 'unknown';
  if (country === 'IL') return DISTRICTS[region] || 'unknown';
  if (country === 'PS') return 'ys';
  return 'abroad';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  const { src, dev } = req.body || {};
  if (!SOURCES.includes(src) || !DEVICES.includes(dev)) return res.status(400).json({ error: 'bad input' });
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem' }).format(new Date());
  const inc = (f) => ({ fieldPath: f, increment: { integerValue: '1' } });
  try {
    const r = await fetch(`https://firestore.googleapis.com/v1/${DB}:commit?key=${KEY}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        writes: [{
          update: { name: `${DB}/mangalVisitInfo/${day}`, fields: {} },
          updateMask: { fieldPaths: [] },
          updateTransforms: [inc(`src_${src}`), inc(`dev_${dev}`), inc(`area_${area(req.headers)}`)],
        }],
      }),
    });
    return res.status(r.ok ? 200 : 502).json({ ok: r.ok });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
