import { handleUpload, handleUploadPresigned } from '@vercel/blob/client';
import { issueSignedToken } from '@vercel/blob';
import { isAdmin } from './_auth.js';
import { blobAuth, blobEnvReport } from './_blob.js';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm'];
const MAX_BYTES = 300 * 1024 * 1024;

async function requireAdmin(pathname, clientPayload) {
  let passHash = null;
  try { passHash = JSON.parse(clientPayload || '{}').passHash; } catch {}
  if (!(await isAdmin(passHash))) throw new Error('unauthorized');
  if (!/^gallery\/[\w.-]+$/.test(pathname)) throw new Error('bad pathname');
}

export default async function handler(req, res) {
  const auth = blobAuth(req);
  if (req.method === 'GET') {
    return res.status(200).json({ configured: Boolean(auth.mode), mode: auth.mode, env: blobEnvReport(req) });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  if (!auth.mode) return res.status(503).json({ error: 'storage-not-connected' });

  try {
    const body = req.body || {};
    if (body.type === 'blob.generate-presigned-url') {
      const result = await handleUploadPresigned({
        body,
        request: req,
        // only used to verify upload-completed callbacks, which we never request
        webhookPublicKey: process.env.BLOB_WEBHOOK_PUBLIC_KEY || 'unused-no-callbacks',
        getSignedToken: async (pathname, clientPayload) => {
          await requireAdmin(pathname, clientPayload);
          const token = await issueSignedToken({
            ...auth.options,
            pathname,
            operations: ['put'],
            allowedContentTypes: ALLOWED_TYPES,
            maximumSizeInBytes: MAX_BYTES,
          });
          return { token };
        },
      });
      return res.status(200).json(result);
    }
    if (auth.mode !== 'token') throw new Error('this store needs the presigned upload flow');
    const result = await handleUpload({
      token: auth.options.token,
      body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        await requireAdmin(pathname, clientPayload);
        return { allowedContentTypes: ALLOWED_TYPES, maximumSizeInBytes: MAX_BYTES, addRandomSuffix: true };
      },
    });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.message === 'unauthorized' ? 401 : 400).json({ error: err.message });
  }
}
