import { NextResponse } from 'next/server'
import { db, initDB } from '@/db'
import { statusEntries, tags, members, publicHolidays } from '@/db/schema'
import { eq, and, lte, gte } from 'drizzle-orm'
import {
  format, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  eachDayOfInterval, isWeekend, isBefore,
} from 'date-fns'
import {
  buildHolidayMap, countRTODays, getWeekRTORequired,
  getWeekWorkingDays, RTO_CATEGORIES, type HolidayMap,
} from '@/lib/rto'

initDB()

function buildStatusByDate(
  entries: Array<{ startDate: string; endDate: string; tagCategory: string | null }>,
  days: Date[],
): Record<string, string> {
  const map: Record<string, string> = {}
  for (const day of days) {
    const dateStr = format(day, 'yyyy-MM-dd')
    for (const entry of entries) {
      if (entry.startDate <= dateStr && entry.endDate >= dateStr && entry.tagCategory) {
        map[dateStr] = entry.tagCategory
        break
      }
    }
  }
  return map
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const weekParam  = searchParams.get('week')   // ISO week: 2026-W15
  const monthParam = searchParams.get('month')  // 2026-04

  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd   = endOfWeek(now, { weekStartsOn: 1 })
  const monthStart = startOfMonth(now)
  const monthEnd   = endOfMonth(now)

  const weekFrom  = format(weekStart,  'yyyy-MM-dd')
  const weekTo    = format(weekEnd,    'yyyy-MM-dd')
  const monthFrom = format(monthStart, 'yyyy-MM-dd')
  const monthTo   = format(monthEnd,   'yyyy-MM-dd')

  const year = now.getFullYear()
  const holidayRows = db.select().from(publicHolidays).where(eq(publicHolidays.year, year)).all()
  const holidayMap  = buildHolidayMap(holidayRows)

  const allMembers = db.select().from(members).where(eq(members.isActive, true)).all()

  const weekDays  = eachDayOfInterval({ start: weekStart,  end: weekEnd  })
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Pre-fetch all entries for the month (covers week too)
  const allEntries = db
    .select({
      memberId:    statusEntries.memberId,
      startDate:   statusEntries.startDate,
      endDate:     statusEntries.endDate,
      tagCategory: tags.category,
    })
    .from(statusEntries)
    .leftJoin(tags, eq(statusEntries.tagId, tags.id))
    .where(and(lte(statusEntries.startDate, monthTo), gte(statusEntries.endDate, monthFrom)))
    .all()

  const weekRtoRequired  = getWeekRTORequired(weekStart, holidayMap)
  const monthRtoRequired = calcMonthRtoRequired(monthDays, holidayMap)

  const result = allMembers.map(member => {
    const memberEntries = allEntries.filter(e => e.memberId === member.id)

    const weekStatusByDate  = buildStatusByDate(memberEntries, weekDays)
    const monthStatusByDate = buildStatusByDate(memberEntries, monthDays)

    const weekRtoCount  = countRTODays(weekDays,  weekStatusByDate,  holidayMap)
    const monthRtoCount = countRTODays(monthDays, monthStatusByDate, holidayMap)

    const weekPast = isBefore(weekEnd, now)
    let status: 'complete' | 'on_track' | 'at_risk' | 'not_met'
    if (weekRtoCount >= weekRtoRequired) status = 'complete'
    else if (weekPast) status = 'not_met'
    else if (weekRtoCount >= weekRtoRequired - 1) status = 'at_risk'
    else status = 'at_risk'

    return {
      memberId:         member.id,
      memberName:       member.name,
      weekRtoCount,
      weekRtoRequired,
      monthRtoCount,
      monthRtoRequired,
      status,
    }
  })

  return NextResponse.json(result)
}

function calcMonthRtoRequired(monthDays: Date[], holidayMap: HolidayMap): number {
  // Only count weeks whose Monday (week start) falls within the month.
  // This gives ~4 weeks × 3 days = 12, matching the "12 per month" target.
  const monthStart = monthDays[0]
  const monthEnd   = monthDays[monthDays.length - 1]
  const weekStarts = new Set<string>()
  for (const day of monthDays) {
    const ws = startOfWeek(day, { weekStartsOn: 1 })
    // Only count weeks that START within (or exactly on) the first day of the month
    if (ws >= monthStart && ws <= monthEnd) {
      weekStarts.add(format(ws, 'yyyy-MM-dd'))
    }
  }
  let total = 0
  for (const ws of weekStarts) {
    total += getWeekRTORequired(new Date(ws + 'T00:00:00'), holidayMap)
  }
  return total
}
