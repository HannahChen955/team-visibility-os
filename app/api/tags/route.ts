import { NextResponse } from 'next/server'
import { db } from '@/db'
import { tags } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { CATEGORY_COLORS } from '@/data/seed'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const rows = category
    ? await db.select().from(tags).where(eq(tags.category, category))
    : await db.select().from(tags)
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
  await db.insert(tags).values({ id, name, category, colorHex, isDefault: false, createdAt: now })
  return NextResponse.json({ id, name, category, colorHex, isDefault: false, createdAt: now }, { status: 201 })
}
