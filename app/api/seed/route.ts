import { NextResponse } from 'next/server'
import { db, initDB } from '@/db'
import { members, tags, locations, publicHolidays } from '@/db/schema'
import { nanoid } from 'nanoid'
import { CATEGORY_COLORS } from '@/data/seed'

export async function POST() {
  // Create tables
  await initDB()

  // Skip if already seeded
  const existing = await db.select().from(members)
  if (existing.length > 0) {
    return NextResponse.json({ message: 'Already seeded', count: existing.length })
  }

  const now = new Date().toISOString()

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

  return NextResponse.json({
    message: 'Seed complete',
    members: memberData.length,
    tags: tagData.length,
    locations: locationData.length,
    holidays: holidays2026.length,
  })
}
