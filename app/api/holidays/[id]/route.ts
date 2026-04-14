import { NextResponse } from 'next/server'
import { db } from '@/db'
import { publicHolidays } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.delete(publicHolidays).where(eq(publicHolidays.id, id))
  return NextResponse.json({ success: true })
}
