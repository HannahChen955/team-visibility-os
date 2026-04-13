import { NextResponse } from 'next/server'
import { db, initDB } from '@/db'
import { publicHolidays } from '@/db/schema'
import { eq } from 'drizzle-orm'

initDB()

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  db.delete(publicHolidays).where(eq(publicHolidays.id, id)).run()
  return NextResponse.json({ success: true })
}
