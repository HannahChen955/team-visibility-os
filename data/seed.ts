import { nanoid } from 'nanoid'
import { db, initDB } from '../db'
import { members, tags, locations, publicHolidays } from '../db/schema'

// ── Category color map ────────────────────────────────────────────────────────
export const CATEGORY_COLORS: Record<string, string> = {
  office:    '#fef08a',
  onsite_cm: '#86efac',
  wfh:       '#d1d5db',
  leave:     '#fca5a5',
  holiday:   '#c4b5fd',
  vn:        '#bae6fd',
}

// ── RTO-eligible categories ───────────────────────────────────────────────────
export const RTO_CATEGORIES = new Set(['office', 'onsite_cm', 'vn', 'leave', 'holiday'])

const now = new Date().toISOString()

async function seed() {
  initDB()

  // ── Skip if already seeded ─────────────────────────────────────────────────
  const existing = db.select().from(members).all()
  if (existing.length > 0) {
    console.log('Already seeded, skipping.')
    return
  }

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
    db.insert(members).values({
      id: nanoid(), name: m.name, baseLocation: m.base, scope: m.scope, isActive: true, createdAt: now,
    }).run()
  }

  // ── Tags ───────────────────────────────────────────────────────────────────
  const tagData = [
    // Office category
    { name: 'Office', category: 'office' },
    { name: 'GTD',    category: 'office' },
    // On-site CM
    { name: 'GTK', category: 'onsite_cm' },
    { name: 'HQ',  category: 'onsite_cm' },
    { name: 'LC',  category: 'onsite_cm' },
    { name: 'TL',  category: 'onsite_cm' },
    { name: 'ICT', category: 'onsite_cm' },
    { name: 'Lux', category: 'onsite_cm' },
    { name: 'ETL', category: 'onsite_cm' },
    // WFH
    { name: 'WFH', category: 'wfh' },
    // Leave
    { name: 'PTO', category: 'leave' },
    { name: 'SL',  category: 'leave' },
    { name: 'RC',  category: 'leave' },
    // Holiday
    { name: 'Holiday', category: 'holiday' },
    // VN
    { name: 'VN', category: 'vn' },
  ]
  for (const t of tagData) {
    db.insert(tags).values({
      id: nanoid(), name: t.name, category: t.category,
      colorHex: CATEGORY_COLORS[t.category], isDefault: true, createdAt: now,
    }).run()
  }

  // ── Locations ──────────────────────────────────────────────────────────────
  const locationData = [
    { name: 'Shanghai Office', type: 'office',   isBase: true },
    { name: 'Shenzhen Office', type: 'office',   isBase: true },
    { name: 'Suzhou Office',   type: 'office',   isBase: true },
    { name: 'GTK – Site A',    type: 'cm_site',  isBase: false },
    { name: 'HQ – Main',       type: 'cm_site',  isBase: false },
    { name: 'LC – Site A',     type: 'cm_site',  isBase: false },
    { name: 'TL – Site A',     type: 'cm_site',  isBase: false },
    { name: 'ICT – Site A',    type: 'cm_site',  isBase: false },
    { name: 'Lux – Site A',    type: 'cm_site',  isBase: false },
    { name: 'ETL – Site A',    type: 'cm_site',  isBase: false },
  ]
  for (const l of locationData) {
    db.insert(locations).values({
      id: nanoid(), name: l.name, type: l.type, isBase: l.isBase, createdAt: now,
    }).run()
  }

  // ── China Public Holidays 2026 ─────────────────────────────────────────────
  // Source: standard CN schedule (verify against official gov.cn announcement)
  const holidays2026 = [
    // 元旦
    { date: '2026-01-01', name: '元旦 New Year', isWorkday: false },
    // 春节 (Feb 17–23, compensatory days: Feb 7 Sat & Feb 28 Sat)
    { date: '2026-02-07', name: '春节 补班',       isWorkday: true  },
    { date: '2026-02-17', name: '春节',            isWorkday: false },
    { date: '2026-02-18', name: '春节',            isWorkday: false },
    { date: '2026-02-19', name: '春节',            isWorkday: false },
    { date: '2026-02-20', name: '春节',            isWorkday: false },
    { date: '2026-02-21', name: '春节',            isWorkday: false },
    { date: '2026-02-22', name: '春节',            isWorkday: false },
    { date: '2026-02-23', name: '春节',            isWorkday: false },
    { date: '2026-02-28', name: '春节 补班',       isWorkday: true  },
    // 清明节
    { date: '2026-04-05', name: '清明节 Qingming', isWorkday: false },
    { date: '2026-04-06', name: '清明节 Qingming', isWorkday: false },
    // 劳动节 (May 1–5, compensatory: Apr 26 Sun)
    { date: '2026-04-26', name: '劳动节 补班',     isWorkday: true  },
    { date: '2026-05-01', name: '劳动节 Labor Day', isWorkday: false },
    { date: '2026-05-02', name: '劳动节 Labor Day', isWorkday: false },
    { date: '2026-05-03', name: '劳动节 Labor Day', isWorkday: false },
    { date: '2026-05-04', name: '劳动节 Labor Day', isWorkday: false },
    { date: '2026-05-05', name: '劳动节 Labor Day', isWorkday: false },
    // 端午节 (June 19-21)
    { date: '2026-06-19', name: '端午节 Dragon Boat', isWorkday: false },
    { date: '2026-06-20', name: '端午节 Dragon Boat', isWorkday: false },
    { date: '2026-06-21', name: '端午节 Dragon Boat', isWorkday: false },
    // 国庆节 + 中秋节 (Oct 1–8, compensatory: Sep 27 Sun)
    { date: '2026-09-27', name: '国庆 补班',         isWorkday: true  },
    { date: '2026-10-01', name: '国庆节 National Day', isWorkday: false },
    { date: '2026-10-02', name: '国庆节 National Day', isWorkday: false },
    { date: '2026-10-03', name: '国庆节 National Day', isWorkday: false },
    { date: '2026-10-04', name: '中秋节 Mid-Autumn',  isWorkday: false },
    { date: '2026-10-05', name: '国庆节 National Day', isWorkday: false },
    { date: '2026-10-06', name: '国庆节 National Day', isWorkday: false },
    { date: '2026-10-07', name: '国庆节 National Day', isWorkday: false },
    { date: '2026-10-08', name: '国庆节 National Day', isWorkday: false },
  ]
  for (const h of holidays2026) {
    const year = parseInt(h.date.split('-')[0])
    db.insert(publicHolidays).values({
      id: nanoid(), date: h.date, name: h.name, isWorkday: h.isWorkday, year, createdAt: now,
    }).run()
  }

  console.log('Seed complete: 20 members, 15 tags, 10 locations, 2026 holidays.')
}

seed().catch(console.error)
