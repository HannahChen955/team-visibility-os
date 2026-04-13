import { NextResponse } from 'next/server'
import { db, initDB } from '@/db'
import { tags } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { CATEGORY_COLORS } from '@/data/seed'

initDB()

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const rows = category
    ? db.select().from(tags).where(eq(tags.category, category)).all()
    : db.select().from(tags).all()
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { name, category } = body
  if (!name || !category) {
    return NextResponse.json({ error: 'name and category are required' }, { status: 400 })
  }
  const id = nanoid()
  const colorHex = CATEGORY_COLORS[category] ?? '#e5e7eb'
  const now = new Date().toISOString()
  db.insert(tags).values({ id, name, category, colorHex, isDefault: false, createdAt: now }).run()
  return NextResponse.json({ id, name, category, colorHex, isDefault: false, createdAt: now }, { status: 201 })
}
