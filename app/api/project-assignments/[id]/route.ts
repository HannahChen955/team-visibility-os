import { NextResponse } from 'next/server'
import { db } from '@/db'
import { projectAssignments } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const updates: Record<string, unknown> = {}
  if (body.startMonth !== undefined) updates.startMonth = body.startMonth
  if (body.endMonth   !== undefined) updates.endMonth   = body.endMonth
  if (body.role       !== undefined) updates.role       = body.role
  await db.update(projectAssignments).set(updates).where(eq(projectAssignments.id, id))
  return NextResponse.json({ success: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.delete(projectAssignments).where(eq(projectAssignments.id, id))
  return NextResponse.json({ success: true })
}
