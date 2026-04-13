import { NextResponse } from 'next/server'
import { db, initDB } from '@/db'
import { members } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

initDB()

export async function GET() {
  const rows = db.select().from(members).where(eq(members.isActive, true)).all()
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { name, baseLocation, scope } = body
  if (!name || !baseLocation) {
    return NextResponse.json({ error: 'name and baseLocation are required' }, { status: 400 })
  }
  const id = nanoid()
  const now = new Date().toISOString()
  db.insert(members).values({ id, name, baseLocation, scope: scope ?? null, isActive: true, createdAt: now }).run()
  return NextResponse.json({ id, name, baseLocation, scope, isActive: true, createdAt: now }, { status: 201 })
}
