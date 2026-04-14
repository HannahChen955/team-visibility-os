import { NextResponse } from 'next/server'
import { db } from '@/db'
import { projects } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const updates: Record<string, unknown> = {}
  if (body.name        !== undefined) updates.name        = body.name
  if (body.colorHex    !== undefined) updates.colorHex    = body.colorHex
  if (body.description !== undefined) updates.description = body.description
  await db.update(projects).set(updates).where(eq(projects.id, id))
  return NextResponse.json({ success: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.delete(projects).where(eq(projects.id, id))
  return NextResponse.json({ success: true })
}
