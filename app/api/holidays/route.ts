import { NextResponse } from 'next/server'
import { db } from '@/db'
import { publicHolidays } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const year = searchParams.get('year')
  const rows = year
    ? await db.select().from(publicHolidays).where(eq(publicHolidays.year, parseInt(year)))
    : await db.select().from(publicHolidays)
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  const body = await req.json()
  const items: Array<{ date: string; name: string; isWorkday?: boolean }> = Array.isArray(body) ? body : [body]
  const now = new Date().toISOString()
  const inserted = []
  for (const item of items) {
    if (!item.date || !item.name) continue
    const year = parseInt(item.date.split('-')[0])
    const id = nanoid()
    try {
      await db.insert(publicHolidays).values({
        id, date: item.date, name: item.name,
        isWorkday: item.isWorkday ?? false, year, createdAt: now,
      })
      inserted.push({ id, ...item, year })
    } catch {
      // Skip duplicate dates
    }
  }
  return NextResponse.json(inserted, { status: 201 })
}
