import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'

const client = createClient({
  url:       process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

export const db = drizzle(client, { schema })

export async function initDB() {
  await client.executeMultiple(`
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

    CREATE TABLE IF NOT EXISTS projects (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      color_hex   TEXT NOT NULL DEFAULT '#93c5fd',
      description TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS project_assignments (
      id         TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id),
      member_id  TEXT NOT NULL REFERENCES members(id),
      month      TEXT NOT NULL,
      role       TEXT NOT NULL DEFAULT 'support',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(project_id, member_id, month)
    );
  `)
}
