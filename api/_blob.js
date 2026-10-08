// A Blob store can reach a project either as a read-write token
// (BLOB_READ_WRITE_TOKEN, or <PREFIX>_READ_WRITE_TOKEN when connected with a
// custom prefix) or, on newer connections, as a store id used with the
// request's OIDC token. Support both.

function findEnv(suffix, valuePrefix = '') {
  const exact = process.env['BLOB' + suffix];
  if (exact) return exact;
  const key = Object.keys(process.env).find(
    (k) => k.endsWith(suffix) && process.env[k] && process.env[k].startsWith(valuePrefix),
  );
  return key ? process.env[key] : undefined;
}

export function blobAuth(req) {
  const token = findEnv('_READ_WRITE_TOKEN', 'vercel_blob_rw_');
  if (token) return { mode: 'token', options: { token } };
  const storeId = findEnv('_STORE_ID');
  const oidcToken = req.headers['x-vercel-oidc-token'] || process.env.VERCEL_OIDC_TOKEN;
  if (storeId && oidcToken) return { mode: 'oidc', options: { storeId, oidcToken } };
  return { mode: null, options: {} };
}

// Names only (never values), so the admin screen can show what the function sees.
export function blobEnvReport(req) {
  return {
    names: Object.keys(process.env).filter((k) => /BLOB|READ_WRITE_TOKEN|STORE_ID/.test(k)).sort(),
    oidc: Boolean(req.headers['x-vercel-oidc-token'] || process.env.VERCEL_OIDC_TOKEN),
  };
}
