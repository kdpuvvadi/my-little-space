import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

export type SiteRow = {
  key: string;
  site: string;
  title: string;
  icon: string;
  source: string;
  updated_at: number;
};

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const databasePath =
    process.env.DATABASE_PATH ||
    path.join(process.env.DATA_DIR || path.join(process.cwd(), 'data'), 'meta.sqlite');

  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  db = new Database(databasePath);
  db.pragma('journal_mode = WAL');
  migrate(db);
  return db;
}

function migrate(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS sites (
      key TEXT PRIMARY KEY NOT NULL,
      site TEXT NOT NULL,
      title TEXT NOT NULL,
      icon TEXT NOT NULL,
      source TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS stats (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      requests INTEGER NOT NULL DEFAULT 0,
      responses INTEGER NOT NULL DEFAULT 0,
      success INTEGER NOT NULL DEFAULT 0,
      failed INTEGER NOT NULL DEFAULT 0
    );

    INSERT OR IGNORE INTO stats (id, requests, responses, success, failed)
    VALUES (1, 0, 0, 0, 0);

    CREATE TABLE IF NOT EXISTS clients (
      client_id TEXT PRIMARY KEY NOT NULL,
      first_seen_at INTEGER NOT NULL,
      last_seen_at INTEGER NOT NULL
    );
  `);
}
