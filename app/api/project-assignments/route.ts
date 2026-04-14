import { NextResponse } from 'next/server'
import { db } from '@/db'
import { projectAssignments, projects, members } from '@/db/schema'
import { eq, and, or, lte, gte } from 'drizzle-orm'
import { nanoid } from 'nanoid'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const year      = searchParams.get('year')
  const projectId = searchParams.get('project_id')
  const memberId  = searchParams.get('member_id')

  const rows = await db
    .select({
      id:           projectAssignments.id,
      projectId:    projectAssignments.projectId,
      memberId:     projectAssignments.memberId,
      startMonth:   projectAssignments.startMonth,
      endMonth:     projectAssignments.endMonth,
      role:         projectAssignments.role,
      projectName:  projects.name,
      projectColor: projects.colorHex,
      memberName:   members.name,
      memberScope:  members.scope,
    })
    .from(projectAssignments)
    .leftJoin(projects, eq(projectAssignments.projectId, projects.id))
    .leftJoin(members,  eq(projectAssignments.memberId,  members.id))

  let filtered = rows
  if (year) {
    const yStart = `${year}-01`
    const yEnd   = `${year}-12`
    filtered = filtered.filter(r => r.startMonth <= yEnd && r.endMonth >= yStart)
  }
  if (projectId) filtered = filtered.filter(r => r.projectId === projectId)
  if (memberId)  filtered = filtered.filter(r => r.memberId  === memberId)

  return NextResponse.json(filtered)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { projectId, memberId, startMonth, endMonth, role = 'support' } = body
  if (!projectId || !memberId || !startMonth || !endMonth) {
    return NextResponse.json({ error: 'projectId, memberId, startMonth, endMonth required' }, { status: 400 })
  }
  if (startMonth > endMonth) {
    return NextResponse.json({ error: 'startMonth must be <= endMonth' }, { status: 400 })
  }
  const id  = nanoid()
  const now = new Date().toISOString()
  await db.insert(projectAssignments).values({ id, projectId, memberId, startMonth, endMonth, role, createdAt: now })
  return NextResponse.json({ id, projectId, memberId, startMonth, endMonth, role }, { status: 201 })
}
