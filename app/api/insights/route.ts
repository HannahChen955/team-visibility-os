import { NextResponse } from 'next/server'
import { db, initDB } from '@/db'
import { statusEntries, tags, members, publicHolidays } from '@/db/schema'
import { eq, and, lte, gte } from 'drizzle-orm'
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns'
import { buildHolidayMap, getWeekWorkingDays, getWeekRTORequired } from '@/lib/rto'

initDB()

export async function GET() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })
  const weekStartStr = format(weekStart, 'yyyy-MM-dd')
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd')

  // Get all active members
  const allMembers = db.select().from(members).where(eq(members.isActive, true)).all()
  const totalMembers = allMembers.length

  // Get today's entries
  const todayEntries = db
    .select({ memberId: statusEntries.memberId, category: tags.category, tagName: tags.name })
    .from(statusEntries)
    .leftJoin(tags, eq(statusEntries.tagId, tags.id))
    .where(and(lte(statusEntries.startDate, today), gte(statusEntries.endDate, today)))
    .all()

  // Summarize by category
  const todayCatCount: Record<string, number> = {}
  const todayMemberIds = new Set<string>()
  for (const e of todayEntries) {
    const cat = e.category ?? 'unknown'
    todayCatCount[cat] = (todayCatCount[cat] ?? 0) + 1
    if (e.memberId) todayMemberIds.add(e.memberId)
  }
  const officeCount  = (todayCatCount['office'] ?? 0)
  const wfhCount     = (todayCatCount['wfh'] ?? 0)
  const leaveCount   = (todayCatCount['leave'] ?? 0)
  const travelCount  = (todayCatCount['onsite_cm'] ?? 0) + (todayCatCount['vn'] ?? 0)
  const noEntryCount = totalMembers - todayMemberIds.size

  // Tomorrow office count
  const tomorrowEntries = db
    .select({ category: tags.category })
    .from(statusEntries)
    .leftJoin(tags, eq(statusEntries.tagId, tags.id))
    .where(and(lte(statusEntries.startDate, tomorrow), gte(statusEntries.endDate, tomorrow)))
    .all()
  const tomorrowOffice = tomorrowEntries.filter(
    e => e.category === 'office' || e.category === 'onsite_cm'
  ).length

  // Holiday data for this week
  const year = new Date().getFullYear()
  const holidayRows = db.select().from(publicHolidays)
    .where(eq(publicHolidays.year, year)).all()
  const holidayMap = buildHolidayMap(holidayRows)
  const { holidayCount } = getWeekWorkingDays(weekStart, holidayMap)
  const weekRtoRequired = getWeekRTORequired(weekStart, holidayMap)

  // Build alerts
  const alerts = []
  if (tomorrowOffice === 0) {
    alerts.push({ type: 'danger' as const, message: '⚠️ No office / on-site coverage tomorrow' })
  }
  if (officeCount + travelCount === 0) {
    alerts.push({ type: 'warning' as const, message: '⚠️ No one in office or on-site today' })
  }
  if (leaveCount > totalMembers * 0.5) {
    alerts.push({ type: 'warning' as const, message: `⚠️ High leave concentration — ${leaveCount} people on leave today` })
  }
  if (noEntryCount > 0) {
    alerts.push({ type: 'info' as const, message: `${noEntryCount} member${noEntryCount > 1 ? 's' : ''} with no status logged today` })
  }
  if (holidayCount > 0) {
    alerts.push({ type: 'info' as const, message: `${holidayCount} public holiday${holidayCount > 1 ? 's' : ''} this week — RTO requirement: ${weekRtoRequired} day${weekRtoRequired !== 1 ? 's' : ''}` })
  }

  return NextResponse.json({
    date: today,
    officeCount,
    wfhCount,
    leaveCount,
    travelCount,
    noEntryCount,
    totalMembers,
    alerts,
    weekHolidayCount: holidayCount,
    weekRtoRequired,
  })
}
