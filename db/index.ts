import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import path from 'path'
import fs from 'fs'

const DB_PATH = process.env.DATABASE_URL ?? path.join(process.cwd(), 'data', 'team-visibility.db')

// Ensure the data directory exists
const dir = path.dirname(DB_PATH)
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true })
}

const sqlite = new Database(DB_PATH)

// Enable WAL mode for better concurrent read performance
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema })

// Run schema creation (idempotent)
export function initDB() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS members (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      base_location TEXT NOT NULL,
      scope         TEXT,
      is_active     INTEGER NOT NULL DEFAULT 1,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tags (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      category   TEXT NOT NULL,
      color_hex  TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS locations (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      type       TEXT NOT NULL DEFAULT 'office',
      is_base    INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS status_entries (
      id          TEXT PRIMARY KEY,
      member_id   TEXT NOT NULL REFERENCES members(id),
      tag_id      TEXT NOT NULL REFERENCES tags(id),
      location_id TEXT REFERENCES locations(id),
      start_date  TEXT NOT NULL,
      end_date    TEXT NOT NULL,
      notes       TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS public_holidays (
      id         TEXT PRIMARY KEY,
      date       TEXT NOT NULL UNIQUE,
      name       TEXT NOT NULL,
      is_workday INTEGER NOT NULL DEFAULT 0,
      year       INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
}
