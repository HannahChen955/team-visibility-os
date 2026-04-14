import { NextResponse } from 'next/server'
import { createClient } from '@libsql/client'

export async function POST() {
  const client = createClient({
    url:       process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })

  // Drop old month-based table and recreate with range-based schema
  await client.executeMultiple(`
    DROP TABLE IF EXISTS project_assignments;

    CREATE TABLE IF NOT EXISTS project_assignments (
      id          TEXT PRIMARY KEY,
      project_id  TEXT NOT NULL REFERENCES projects(id),
      member_id   TEXT NOT NULL REFERENCES members(id),
      start_month TEXT NOT NULL,
      end_month   TEXT NOT NULL,
      role        TEXT NOT NULL DEFAULT 'support',
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  return NextResponse.json({ message: 'Migration complete: project_assignments rebuilt with range schema' })
}
