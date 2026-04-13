import { NextResponse } from 'next/server'
import { db, initDB } from '@/db'
import { tags } from '@/db/schema'
import { eq } from 'drizzle-orm'

initDB()

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { name } = body
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })
  db.update(tags).set({ name }).where(eq(tags.id, id)).run()
  return NextResponse.json({ success: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  db.delete(tags).where(eq(tags.id, id)).run()
  return NextResponse.json({ success: true })
}
