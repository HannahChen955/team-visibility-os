import { NextResponse } from 'next/server'
import { db, initDB } from '@/db'
import { publicHolidays } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

initDB()

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const year = searchParams.get('year')
  const rows = year
    ? db.select().from(publicHolidays).where(eq(publicHolidays.year, parseInt(year))).all()
    : db.select().from(publicHolidays).all()
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  const body = await req.json()
  // Support bulk array or single object
  const items: Array<{ date: string; name: string; isWorkday?: boolean }> = Array.isArray(body) ? body : [body]
  const now = new Date().toISOString()
  const inserted = []
  for (const item of items) {
    if (!item.date || !item.name) continue
    const year = parseInt(item.date.split('-')[0])
    const id = nanoid()
    try {
      db.insert(publicHolidays).values({
        id, date: item.date, name: item.name,
        isWorkday: item.isWorkday ?? false, year, createdAt: now,
      }).run()
      inserted.push({ id, ...item, year })
    } catch {
      // Skip duplicate dates
    }
  }
  return NextResponse.json(inserted, { status: 201 })
}
