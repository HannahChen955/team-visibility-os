import { NextResponse } from 'next/server'
import { db } from '@/db'
import { locations } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const rows = type
    ? await db.select().from(locations).where(eq(locations.type, type))
    : await db.select().from(locations)
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { name, type = 'office' } = body
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })
  const id = nanoid()
  const now = new Date().toISOString()
  await db.insert(locations).values({ id, name, type, isBase: false, createdAt: now })
  return NextResponse.json({ id, name, type, isBase: false, createdAt: now }, { status: 201 })
}
