import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';

export function openDatabase(path: string) {
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
  const version = (db.prepare('PRAGMA user_version').get() as { user_version: number }).user_version;
  if (version === 0) db.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
  else if (version !== 1) { db.close(); throw new Error('UNSUPPORTED_DATABASE_VERSION'); }
  return db;
}
