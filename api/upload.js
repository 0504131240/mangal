import { handleUpload } from '@vercel/blob/client';
import { isAdmin } from './_auth.js';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm'];
const MAX_BYTES = 300 * 1024 * 1024;

export default async function handler(req, res) {
  const configured = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  if (req.method === 'GET') return res.status(200).json({ configured });
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  if (!configured) return res.status(503).json({ error: 'storage-not-connected' });

  try {
    const result = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let passHash = null;
        try { passHash = JSON.parse(clientPayload || '{}').passHash; } catch {}
        if (!(await isAdmin(passHash))) throw new Error('unauthorized');
        if (!/^gallery\/[\w.-]+$/.test(pathname)) throw new Error('bad pathname');
        return { allowedContentTypes: ALLOWED_TYPES, maximumSizeInBytes: MAX_BYTES, addRandomSuffix: true };
      },
    });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.message === 'unauthorized' ? 401 : 400).json({ error: err.message });
  }
}
