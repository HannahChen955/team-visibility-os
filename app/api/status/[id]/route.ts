import { NextResponse } from 'next/server'
import { db, initDB } from '@/db'
import { statusEntries } from '@/db/schema'
import { eq } from 'drizzle-orm'

initDB()

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const now = new Date().toISOString()
  const updates: Record<string, unknown> = { updatedAt: now }
  if (body.tagId      !== undefined) updates.tagId      = body.tagId
  if (body.locationId !== undefined) updates.locationId = body.locationId
  if (body.startDate  !== undefined) updates.startDate  = body.startDate
  if (body.endDate    !== undefined) updates.endDate    = body.endDate
  if (body.notes      !== undefined) updates.notes      = body.notes
  db.update(statusEntries).set(updates).where(eq(statusEntries.id, id)).run()
  return NextResponse.json({ success: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  db.delete(statusEntries).where(eq(statusEntries.id, id)).run()
  return NextResponse.json({ success: true })
}
