import { NextResponse } from 'next/server'
import { db } from '@/db'
import { statusEntries, tags, locations, members } from '@/db/schema'
import { eq, and, lte, gte } from 'drizzle-orm'
import { nanoid } from 'nanoid'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const date     = searchParams.get('date')
  const memberId = searchParams.get('member_id')
  const from     = searchParams.get('from')
  const to       = searchParams.get('to')

  const base = db
    .select({
      id:           statusEntries.id,
      memberId:     statusEntries.memberId,
      tagId:        statusEntries.tagId,
      locationId:   statusEntries.locationId,
      startDate:    statusEntries.startDate,
      endDate:      statusEntries.endDate,
      notes:        statusEntries.notes,
      createdAt:    statusEntries.createdAt,
      updatedAt:    statusEntries.updatedAt,
      tagName:      tags.name,
      tagColor:     tags.colorHex,
      tagCategory:  tags.category,
      locationName: locations.name,
      memberName:   members.name,
    })
    .from(statusEntries)
    .leftJoin(tags,      eq(statusEntries.tagId,      tags.id))
    .leftJoin(locations, eq(statusEntries.locationId, locations.id))
    .leftJoin(members,   eq(statusEntries.memberId,   members.id))

  if (date) {
    const rows = await base.where(and(lte(statusEntries.startDate, date), gte(statusEntries.endDate, date)))
    return NextResponse.json(rows)
  }
  if (memberId) {
    const rows = await base.where(eq(statusEntries.memberId, memberId))
    return NextResponse.json(rows)
  }
  if (from && to) {
    const rows = await base.where(and(lte(statusEntries.startDate, to), gte(statusEntries.endDate, from)))
    return NextResponse.json(rows)
  }

  const rows = await base
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { memberId, tagId, locationId, startDate, endDate, notes } = body
  if (!memberId || !tagId || !startDate || !endDate) {
    return NextResponse.json({ error: 'memberId, tagId, startDate, endDate are required' }, { status: 400 })
  }
  const id = nanoid()
  const now = new Date().toISOString()
  await db.insert(statusEntries).values({
    id, memberId, tagId,
    locationId: locationId ?? null,
    startDate, endDate,
    notes: notes ?? null,
    createdAt: now, updatedAt: now,
  })
  return NextResponse.json({ id, memberId, tagId, locationId, startDate, endDate, notes, createdAt: now, updatedAt: now }, { status: 201 })
}
