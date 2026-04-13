import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  eachDayOfInterval, format, isWeekend, parseISO, getYear, getMonth,
} from 'date-fns'

export const RTO_CATEGORIES = new Set(['office', 'onsite_cm', 'vn', 'leave', 'holiday'])

export type RTOStatus = 'on_track' | 'at_risk' | 'not_met' | 'complete'

export interface HolidayMap {
  [date: string]: { name: string; isWorkday: boolean }
}

/**
 * Get all working days in a week (Mon–Fri by default, adjusted for 调休)
 * Returns { workingDays, holidayCount, compensatoryCount }
 */
export function getWeekWorkingDays(weekStart: Date, holidays: HolidayMap) {
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
  const allDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  let workingDays = 0
  let holidayCount = 0
  let compensatoryCount = 0

  for (const day of allDays) {
    const dateStr = format(day, 'yyyy-MM-dd')
    const holiday = holidays[dateStr]

    if (holiday) {
      if (holiday.isWorkday) {
        // 补班日 — counts as working day even if weekend
        workingDays++
        compensatoryCount++
      } else {
        // Public holiday — not a working day
        if (!isWeekend(day)) {
          holidayCount++
        }
      }
    } else if (!isWeekend(day)) {
      workingDays++
    }
  }

  return { workingDays, holidayCount, compensatoryCount }
}

/**
 * Calculate required RTO days for a given week
 * Rule: max(0, min(3, workingDays))
 * i.e., can't require more RTO than available working days
 */
export function getWeekRTORequired(weekStart: Date, holidays: HolidayMap): number {
  const { workingDays } = getWeekWorkingDays(weekStart, holidays)
  return Math.max(0, Math.min(3, workingDays))
}

/**
 * For a set of status entries (flattened to daily entries with category),
 * count how many days qualify as RTO in a given date range.
 * Also auto-counts public holidays (non-isWorkday entries in holidays map).
 */
export function countRTODays(
  dateRange: Date[],
  statusByDate: Record<string, string>, // date → category
  holidays: HolidayMap,
): number {
  let count = 0
  for (const day of dateRange) {
    const dateStr = format(day, 'yyyy-MM-dd')
    const holiday = holidays[dateStr]

    // Public holiday (non-workday) always counts
    if (holiday && !holiday.isWorkday) {
      if (!isWeekend(day)) {
        count++
        continue
      }
    }

    // Skip weekends (unless compensatory workday — but those are tracked differently)
    if (isWeekend(day) && !(holiday?.isWorkday)) continue

    const category = statusByDate[dateStr]
    if (category && RTO_CATEGORIES.has(category) && category !== 'holiday') {
      count++
    }
  }
  return count
}

/**
 * Determine RTO status for a member for the current week
 */
export function getRTOStatus(
  rtoCount: number,
  rtoRequired: number,
  isPastPeriod: boolean,
): RTOStatus {
  if (rtoCount >= rtoRequired) return 'complete'
  if (isPastPeriod) return 'not_met'
  if (rtoCount >= rtoRequired - 1) return 'at_risk'
  return 'at_risk'
}

/**
 * Build a holiday lookup map from an array of holiday rows
 */
export function buildHolidayMap(
  rows: Array<{ date: string; name: string; isWorkday: boolean }>
): HolidayMap {
  const map: HolidayMap = {}
  for (const r of rows) {
    map[r.date] = { name: r.name, isWorkday: r.isWorkday }
  }
  return map
}
