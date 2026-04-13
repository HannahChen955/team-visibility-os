import { NextResponse } from 'next/server'
import { db, initDB } from '@/db'
import { locations } from '@/db/schema'
import { eq } from 'drizzle-orm'

initDB()

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const updates: Record<string, unknown> = {}
  if (body.name !== undefined) updates.name = body.name
  if (body.type !== undefined) updates.type = body.type
  db.update(locations).set(updates).where(eq(locations.id, id)).run()
  return NextResponse.json({ success: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  db.delete(locations).where(eq(locations.id, id)).run()
  return NextResponse.json({ success: true })
}
