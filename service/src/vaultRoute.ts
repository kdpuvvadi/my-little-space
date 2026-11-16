import type { Context } from 'hono';
import {
  deleteVault,
  getVault,
  isValidSyncId,
  putVault,
  VAULT_MAX_BYTES,
} from './vault.js';

function syncIdParam(c: Context): string | null {
  const raw = c.req.param('syncId') ?? '';
  const id = raw.trim().toLowerCase();
  return isValidSyncId(id) ? id : null;
}

export async function handleVaultGet(c: Context) {
  const syncId = syncIdParam(c);
  if (!syncId) return c.json({ error: 'Invalid sync id' }, 400);

  const row = getVault(syncId);
  if (!row) return c.json({ error: 'Not found' }, 404);

  try {
    const envelope = JSON.parse(row.blob) as unknown;
    return c.json(envelope);
  } catch {
    return c.json({ error: 'Corrupt vault blob' }, 500);
  }
}

export async function handleVaultPut(c: Context) {
  const syncId = syncIdParam(c);
  if (!syncId) return c.json({ error: 'Invalid sync id' }, 400);

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return c.json({ error: 'Body must be a JSON object' }, 400);
  }

  const blob = JSON.stringify(body);
  if (Buffer.byteLength(blob, 'utf8') > VAULT_MAX_BYTES) {
    return c.json({ error: `Vault exceeds ${VAULT_MAX_BYTES} bytes` }, 413);
  }

  const row = putVault(syncId, blob);
  return c.json({ ok: true, syncId: row.sync_id, updatedAt: row.updated_at, bytes: row.bytes });
}

export async function handleVaultDelete(c: Context) {
  const syncId = syncIdParam(c);
  if (!syncId) return c.json({ error: 'Invalid sync id' }, 400);

  const deleted = deleteVault(syncId);
  if (!deleted) return c.json({ error: 'Not found' }, 404);
  return c.json({ ok: true });
}
