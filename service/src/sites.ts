import { getDb, type SiteRow } from './db.js';

export const SITE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function getSite(key: string): SiteRow | undefined {
  return getDb()
    .prepare(
      `SELECT key, site, title, icon, source, updated_at
       FROM sites WHERE key = ?`,
    )
    .get(key) as SiteRow | undefined;
}

export function upsertSite(row: Omit<SiteRow, 'updated_at'> & { updated_at?: number }): void {
  const updatedAt = row.updated_at ?? Date.now();
  getDb()
    .prepare(
      `INSERT INTO sites (key, site, title, icon, source, updated_at)
       VALUES (@key, @site, @title, @icon, @source, @updated_at)
       ON CONFLICT(key) DO UPDATE SET
         site = excluded.site,
         title = excluded.title,
         icon = excluded.icon,
         source = excluded.source,
         updated_at = excluded.updated_at`,
    )
    .run({
      key: row.key,
      site: row.site,
      title: row.title,
      icon: row.icon,
      source: row.source,
      updated_at: updatedAt,
    });
}

export function isSiteFresh(row: SiteRow, now = Date.now()): boolean {
  return now - row.updated_at <= SITE_TTL_MS;
}
