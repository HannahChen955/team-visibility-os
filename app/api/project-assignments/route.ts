import { NextResponse } from 'next/server'
import { db } from '@/db'
import { projectAssignments, projects, members } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { nanoid } from 'nanoid'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const year      = searchParams.get('year')   // e.g. "2026"
  const projectId = searchParams.get('project_id')
  const memberId  = searchParams.get('member_id')

  const rows = await db
    .select({
      id:          projectAssignments.id,
      projectId:   projectAssignments.projectId,
      memberId:    projectAssignments.memberId,
      month:       projectAssignments.month,
      role:        projectAssignments.role,
      projectName: projects.name,
      projectColor: projects.colorHex,
      memberName:  members.name,
    })
    .from(projectAssignments)
    .leftJoin(projects, eq(projectAssignments.projectId, projects.id))
    .leftJoin(members,  eq(projectAssignments.memberId,  members.id))

  let filtered = rows
  if (year)      filtered = filtered.filter(r => r.month?.startsWith(year))
  if (projectId) filtered = filtered.filter(r => r.projectId === projectId)
  if (memberId)  filtered = filtered.filter(r => r.memberId  === memberId)

  return NextResponse.json(filtered)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { projectId, memberId, month, role = 'support' } = body
  if (!projectId || !memberId || !month) {
    return NextResponse.json({ error: 'projectId, memberId, month are required' }, { status: 400 })
  }
  const id  = nanoid()
  const now = new Date().toISOString()
  try {
    await db.insert(projectAssignments).values({ id, projectId, memberId, month, role, createdAt: now })
    return NextResponse.json({ id, projectId, memberId, month, role }, { status: 201 })
  } catch {
    // Duplicate — update role instead
    await db.update(projectAssignments)
      .set({ role })
      .where(and(
        eq(projectAssignments.projectId, projectId),
        eq(projectAssignments.memberId,  memberId),
        eq(projectAssignments.month,     month),
      ))
    return NextResponse.json({ projectId, memberId, month, role, updated: true })
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id        = searchParams.get('id')
  const projectId = searchParams.get('project_id')
  const memberId  = searchParams.get('member_id')
  const month     = searchParams.get('month')

  if (id) {
    await db.delete(projectAssignments).where(eq(projectAssignments.id, id))
  } else if (projectId && memberId && month) {
    await db.delete(projectAssignments).where(and(
      eq(projectAssignments.projectId, projectId),
      eq(projectAssignments.memberId,  memberId),
      eq(projectAssignments.month,     month),
    ))
  } else {
    return NextResponse.json({ error: 'provide id or projectId+memberId+month' }, { status: 400 })
  }
  return NextResponse.json({ success: true })
}
