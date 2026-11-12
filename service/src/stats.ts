import { getDb } from './db.js';

export type StatsSnapshot = {
  requests: number;
  responses: number;
  success: number;
  failed: number;
  uniqueUsers: number;
};

export function bumpRequest(): void {
  getDb().prepare(`UPDATE stats SET requests = requests + 1 WHERE id = 1`).run();
}

export function bumpResponse(ok: boolean): void {
  getDb()
    .prepare(
      `UPDATE stats SET
         responses = responses + 1,
         success = success + CASE WHEN ? THEN 1 ELSE 0 END,
         failed = failed + CASE WHEN ? THEN 0 ELSE 1 END
       WHERE id = 1`,
    )
    .run(ok ? 1 : 0, ok ? 1 : 0);
}

export function touchClient(clientId: string): void {
  const id = clientId.trim();
  if (!id || id.length > 128) return;
  const now = Date.now();
  getDb()
    .prepare(
      `INSERT INTO clients (client_id, first_seen_at, last_seen_at)
       VALUES (?, ?, ?)
       ON CONFLICT(client_id) DO UPDATE SET last_seen_at = excluded.last_seen_at`,
    )
    .run(id, now, now);
}

export function getStats(): StatsSnapshot {
  const row = getDb()
    .prepare(
      `SELECT requests, responses, success, failed FROM stats WHERE id = 1`,
    )
    .get() as {
    requests: number;
    responses: number;
    success: number;
    failed: number;
  };
  const unique = getDb().prepare(`SELECT COUNT(*) AS n FROM clients`).get() as { n: number };
  return {
    requests: row.requests,
    responses: row.responses,
    success: row.success,
    failed: row.failed,
    uniqueUsers: unique.n,
  };
}
