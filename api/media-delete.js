import { del } from '@vercel/blob';
import { isAdmin } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(503).json({ error: 'storage-not-connected' });

  const { url, passHash } = req.body || {};
  if (!(await isAdmin(passHash))) return res.status(401).json({ error: 'unauthorized' });

  let host = '';
  try { host = new URL(url).hostname; } catch {}
  if (!host.endsWith('.public.blob.vercel-storage.com')) return res.status(400).json({ error: 'not a blob url' });

  try {
    await del(url);
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
