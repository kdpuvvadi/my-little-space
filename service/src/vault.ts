import { getDb } from './db.js';

export type VaultRow = {
  sync_id: string;
  blob: string;
  updated_at: number;
  bytes: number;
};

const SYNC_ID_RE = /^[a-f0-9]{64}$/i;
export const VAULT_MAX_BYTES = 512 * 1024;

export function isValidSyncId(syncId: string): boolean {
  return SYNC_ID_RE.test(syncId.trim());
}

export function getVault(syncId: string): VaultRow | null {
  const row = getDb()
    .prepare(
      `SELECT sync_id, blob, updated_at, bytes FROM vaults WHERE sync_id = ?`,
    )
    .get(syncId.trim().toLowerCase()) as VaultRow | undefined;
  return row ?? null;
}

export function putVault(syncId: string, blob: string): VaultRow {
  const id = syncId.trim().toLowerCase();
  const bytes = Buffer.byteLength(blob, 'utf8');
  const updatedAt = Date.now();
  getDb()
    .prepare(
      `INSERT INTO vaults (sync_id, blob, updated_at, bytes)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(sync_id) DO UPDATE SET
         blob = excluded.blob,
         updated_at = excluded.updated_at,
         bytes = excluded.bytes`,
    )
    .run(id, blob, updatedAt, bytes);
  return { sync_id: id, blob, updated_at: updatedAt, bytes };
}

export function deleteVault(syncId: string): boolean {
  const result = getDb()
    .prepare(`DELETE FROM vaults WHERE sync_id = ?`)
    .run(syncId.trim().toLowerCase());
  return result.changes > 0;
}
