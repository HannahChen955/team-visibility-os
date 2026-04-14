import { NextResponse } from 'next/server'
import { db } from '@/db'
import { members } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { name, baseLocation, scope, isActive } = body
  const updates: Record<string, unknown> = {}
  if (name !== undefined) updates.name = name
  if (baseLocation !== undefined) updates.baseLocation = baseLocation
  if (scope !== undefined) updates.scope = scope
  if (isActive !== undefined) updates.isActive = isActive
  await db.update(members).set(updates).where(eq(members.id, id))
  return NextResponse.json({ success: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.update(members).set({ isActive: false }).where(eq(members.id, id))
  return NextResponse.json({ success: true })
}
