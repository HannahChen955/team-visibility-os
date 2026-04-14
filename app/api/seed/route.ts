import { NextResponse } from 'next/server'
import { db, initDB } from '@/db'
import { members, tags, locations, publicHolidays, projects, projectAssignments } from '@/db/schema'
import { nanoid } from 'nanoid'
import { CATEGORY_COLORS } from '@/data/seed'

export async function POST(req: Request) {
  // Create tables
  await initDB()

  const { searchParams } = new URL(req.url)
  const force = searchParams.get('force') === '1'

  // Skip members/tags/locations/holidays if already seeded (unless force)
  const existing = await db.select().from(members)
  const skipBase = existing.length > 0 && !force

  // Skip projects if they already exist (unless force)
  const existingProjects = await db.select().from(projects)
  const skipProjects = existingProjects.length > 0 && !force

  // Skip assignments if they already exist (unless force)
  const existingAssignments = await db.select().from(projectAssignments)
  const skipAssignments = existingAssignments.length > 0 && !force

  if (skipBase && skipProjects && skipAssignments) {
    return NextResponse.json({ message: 'Already seeded', count: existing.length })
  }

  const now = new Date().toISOString()
  let memberCount = 0, tagCount = 0, locationCount = 0, holidayCount = 0

  if (!skipBase) {
  // ── Members ────────────────────────────────────────────────────────────────
  const memberData = [
    { name: 'Member A', base: 'Shanghai',  scope: 'Supply Chain' },
    { name: 'Member B', base: 'Shanghai',  scope: 'Supply Chain' },
    { name: 'Member C', base: 'Shanghai',  scope: 'Quality' },
    { name: 'Member D', base: 'Shanghai',  scope: 'Quality' },
    { name: 'Member E', base: 'Shanghai',  scope: 'Engineering' },
    { name: 'Member F', base: 'Shanghai',  scope: 'Engineering' },
    { name: 'Member G', base: 'Shanghai',  scope: 'Operations' },
    { name: 'Member H', base: 'Shanghai',  scope: 'Operations' },
    { name: 'Member I', base: 'Shenzhen',  scope: 'Supply Chain' },
    { name: 'Member J', base: 'Shenzhen',  scope: 'Supply Chain' },
    { name: 'Member K', base: 'Shenzhen',  scope: 'Quality' },
    { name: 'Member L', base: 'Shenzhen',  scope: 'Quality' },
    { name: 'Member M', base: 'Shenzhen',  scope: 'Engineering' },
    { name: 'Member N', base: 'Shenzhen',  scope: 'Operations' },
    { name: 'Member O', base: 'Shenzhen',  scope: 'Operations' },
    { name: 'Member P', base: 'Suzhou',    scope: 'Supply Chain' },
    { name: 'Member Q', base: 'Suzhou',    scope: 'Quality' },
    { name: 'Member R', base: 'Suzhou',    scope: 'Engineering' },
    { name: 'Member S', base: 'Suzhou',    scope: 'Engineering' },
    { name: 'Member T', base: 'Suzhou',    scope: 'Operations' },
  ]
  for (const m of memberData) {
    await db.insert(members).values({
      id: nanoid(), name: m.name, baseLocation: m.base, scope: m.scope, isActive: true, createdAt: now,
    })
  }

  // ── Tags ───────────────────────────────────────────────────────────────────
  const tagData = [
    { name: 'Office',   category: 'office' },
    { name: 'GTD',      category: 'office' },
    { name: 'GTK',      category: 'onsite_cm' },
    { name: 'HQ',       category: 'onsite_cm' },
    { name: 'LC',       category: 'onsite_cm' },
    { name: 'TL',       category: 'onsite_cm' },
    { name: 'ICT',      category: 'onsite_cm' },
    { name: 'Lux',      category: 'onsite_cm' },
    { name: 'ETL',      category: 'onsite_cm' },
    { name: 'WFH',      category: 'wfh' },
    { name: 'PTO',      category: 'leave' },
    { name: 'SL',       category: 'leave' },
    { name: 'RC',       category: 'leave' },
    { name: 'Holiday',  category: 'holiday' },
    { name: 'VN',       category: 'vn' },
  ]
  for (const t of tagData) {
    await db.insert(tags).values({
      id: nanoid(), name: t.name, category: t.category,
      colorHex: CATEGORY_COLORS[t.category], isDefault: true, createdAt: now,
    })
  }

  // ── Locations ──────────────────────────────────────────────────────────────
  const locationData = [
    { name: 'Shanghai Office', type: 'office',  isBase: true  },
    { name: 'Shenzhen Office', type: 'office',  isBase: true  },
    { name: 'Suzhou Office',   type: 'office',  isBase: true  },
    { name: 'GTK – Site A',    type: 'cm_site', isBase: false },
    { name: 'HQ – Main',       type: 'cm_site', isBase: false },
    { name: 'LC – Site A',     type: 'cm_site', isBase: false },
    { name: 'TL – Site A',     type: 'cm_site', isBase: false },
    { name: 'ICT – Site A',    type: 'cm_site', isBase: false },
    { name: 'Lux – Site A',    type: 'cm_site', isBase: false },
    { name: 'ETL – Site A',    type: 'cm_site', isBase: false },
  ]
  for (const l of locationData) {
    await db.insert(locations).values({
      id: nanoid(), name: l.name, type: l.type, isBase: l.isBase, createdAt: now,
    })
  }

  // ── China Public Holidays 2026 ─────────────────────────────────────────────
  const holidays2026 = [
    { date: '2026-01-01', name: '元旦 New Year',           isWorkday: false },
    { date: '2026-02-07', name: '春节 补班',                isWorkday: true  },
    { date: '2026-02-17', name: '春节',                    isWorkday: false },
    { date: '2026-02-18', name: '春节',                    isWorkday: false },
    { date: '2026-02-19', name: '春节',                    isWorkday: false },
    { date: '2026-02-20', name: '春节',                    isWorkday: false },
    { date: '2026-02-21', name: '春节',                    isWorkday: false },
    { date: '2026-02-22', name: '春节',                    isWorkday: false },
    { date: '2026-02-23', name: '春节',                    isWorkday: false },
    { date: '2026-02-28', name: '春节 补班',                isWorkday: true  },
    { date: '2026-04-05', name: '清明节 Qingming',          isWorkday: false },
    { date: '2026-04-06', name: '清明节 Qingming',          isWorkday: false },
    { date: '2026-04-26', name: '劳动节 补班',              isWorkday: true  },
    { date: '2026-05-01', name: '劳动节 Labor Day',         isWorkday: false },
    { date: '2026-05-02', name: '劳动节 Labor Day',         isWorkday: false },
    { date: '2026-05-03', name: '劳动节 Labor Day',         isWorkday: false },
    { date: '2026-05-04', name: '劳动节 Labor Day',         isWorkday: false },
    { date: '2026-05-05', name: '劳动节 Labor Day',         isWorkday: false },
    { date: '2026-06-19', name: '端午节 Dragon Boat',       isWorkday: false },
    { date: '2026-06-20', name: '端午节 Dragon Boat',       isWorkday: false },
    { date: '2026-06-21', name: '端午节 Dragon Boat',       isWorkday: false },
    { date: '2026-09-27', name: '国庆 补班',                isWorkday: true  },
    { date: '2026-10-01', name: '国庆节 National Day',      isWorkday: false },
    { date: '2026-10-02', name: '国庆节 National Day',      isWorkday: false },
    { date: '2026-10-03', name: '国庆节 National Day',      isWorkday: false },
    { date: '2026-10-04', name: '中秋节 Mid-Autumn',        isWorkday: false },
    { date: '2026-10-05', name: '国庆节 National Day',      isWorkday: false },
    { date: '2026-10-06', name: '国庆节 National Day',      isWorkday: false },
    { date: '2026-10-07', name: '国庆节 National Day',      isWorkday: false },
    { date: '2026-10-08', name: '国庆节 National Day',      isWorkday: false },
  ]
  for (const h of holidays2026) {
    const year = parseInt(h.date.split('-')[0])
    await db.insert(publicHolidays).values({
      id: nanoid(), date: h.date, name: h.name, isWorkday: h.isWorkday, year, createdAt: now,
    })
  }
  memberCount   = memberData.length
  tagCount      = tagData.length
  locationCount = locationData.length
  holidayCount  = holidays2026.length
  } // end !skipBase

  // ── Projects ──────────────────────────────────────────────────────────────
  const projectData = [
    { name: 'Alpha Platform',    colorHex: '#60a5fa', description: 'Core platform rebuild'         },
    { name: 'Beta Integration',  colorHex: '#34d399', description: 'Third-party system integration' },
    { name: 'Customer Portal',   colorHex: '#fb923c', description: 'Customer-facing portal'         },
    { name: 'Data Pipeline',     colorHex: '#a78bfa', description: 'Internal data infrastructure'   },
    { name: 'Engineering Ops',   colorHex: '#f87171', description: 'DevOps & tooling excellence'    },
    { name: 'Field Deployment',  colorHex: '#4ade80', description: 'On-site CM deployment'          },
    { name: 'GTK Launch',        colorHex: '#2dd4bf', description: 'GTK factory ramp-up'            },
    { name: 'HQ Modernisation',  colorHex: '#e879f9', description: 'HQ workflow digitisation'       },
  ]
  const projectIds: Record<string, string> = {}
  if (!skipProjects) {
    for (const p of projectData) {
      const id = nanoid()
      projectIds[p.name] = id
      await db.insert(projects).values({ id, name: p.name, colorHex: p.colorHex, description: p.description, createdAt: now })
    }
  } else {
    // Map existing project names to ids
    for (const p of existingProjects) { projectIds[p.name] = p.id }
  }

  // ── Project Assignments ────────────────────────────────────────────────────
  // Fetch first 20 members (the original seed batch) by order
  const seededMembers = await db.select().from(members)
  // Use the first 20 members to avoid duplicates from multiple seeds
  const first20 = seededMembers.slice(0, 20)
  const mId = (idx: number) => first20[idx]?.id ?? ''

  // Range-based assignments: { project, member index, startMonth, endMonth, role }
  type RangeRow = { project: string; member: number; start: string; end: string; role: 'dri' | 'support' }
  const assignData: RangeRow[] = [
    { project: 'Alpha Platform',   member: 0,  start: '2026-01', end: '2026-06', role: 'dri'     },
    { project: 'Alpha Platform',   member: 1,  start: '2026-01', end: '2026-06', role: 'support' },
    { project: 'Alpha Platform',   member: 4,  start: '2026-04', end: '2026-08', role: 'support' },

    { project: 'Beta Integration', member: 2,  start: '2026-03', end: '2026-09', role: 'dri'     },
    { project: 'Beta Integration', member: 3,  start: '2026-03', end: '2026-09', role: 'support' },
    { project: 'Beta Integration', member: 6,  start: '2026-05', end: '2026-07', role: 'support' },

    { project: 'Customer Portal',  member: 5,  start: '2026-01', end: '2026-12', role: 'dri'     },
    { project: 'Customer Portal',  member: 6,  start: '2026-01', end: '2026-12', role: 'dri'     },
    { project: 'Customer Portal',  member: 7,  start: '2026-01', end: '2026-06', role: 'support' },

    { project: 'Data Pipeline',    member: 8,  start: '2026-02', end: '2026-08', role: 'dri'     },
    { project: 'Data Pipeline',    member: 9,  start: '2026-02', end: '2026-08', role: 'support' },
    { project: 'Data Pipeline',    member: 12, start: '2026-05', end: '2026-08', role: 'support' },

    { project: 'Engineering Ops',  member: 4,  start: '2026-01', end: '2026-12', role: 'dri'     },
    { project: 'Engineering Ops',  member: 17, start: '2026-07', end: '2026-12', role: 'support' },

    { project: 'Field Deployment', member: 10, start: '2026-04', end: '2026-10', role: 'dri'     },
    { project: 'Field Deployment', member: 11, start: '2026-04', end: '2026-10', role: 'dri'     },
    { project: 'Field Deployment', member: 12, start: '2026-04', end: '2026-10', role: 'support' },

    { project: 'GTK Launch',       member: 13, start: '2026-06', end: '2026-12', role: 'dri'     },
    { project: 'GTK Launch',       member: 14, start: '2026-06', end: '2026-12', role: 'support' },
    { project: 'GTK Launch',       member: 15, start: '2026-09', end: '2026-12', role: 'support' },

    { project: 'HQ Modernisation', member: 15, start: '2026-01', end: '2026-12', role: 'dri'     },
    { project: 'HQ Modernisation', member: 16, start: '2026-01', end: '2026-12', role: 'dri'     },
    { project: 'HQ Modernisation', member: 19, start: '2026-01', end: '2026-06', role: 'support' },
  ]

  let assignCount = 0
  if (!skipAssignments) {
    for (const row of assignData) {
      const pid = projectIds[row.project]
      const mid = mId(row.member)
      if (!pid || !mid) continue
      await db.insert(projectAssignments).values({
        id: nanoid(), projectId: pid, memberId: mid,
        startMonth: row.start, endMonth: row.end,
        role: row.role, createdAt: now,
      })
      assignCount++
    }
  }

  return NextResponse.json({
    message: 'Seed complete',
    members: memberCount,
    tags: tagCount,
    locations: locationCount,
    holidays: holidayCount,
    projects: skipProjects ? 0 : projectData.length,
    assignments: assignCount,
  })
}
