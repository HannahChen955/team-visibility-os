import { NextResponse } from 'next/server'
import { db } from '@/db'
import { projects } from '@/db/schema'
import { nanoid } from 'nanoid'

export async function GET() {
  const rows = await db.select().from(projects)
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { name, colorHex = '#93c5fd', description } = body
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })
  const id = nanoid()
  const now = new Date().toISOString()
  await db.insert(projects).values({ id, name, colorHex, description: description ?? null, createdAt: now })
  return NextResponse.json({ id, name, colorHex, description, createdAt: now }, { status: 201 })
}
