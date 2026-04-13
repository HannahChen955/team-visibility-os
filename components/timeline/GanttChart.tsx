'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  format, addDays, startOfWeek, eachDayOfInterval, isToday,
  isWeekend, addWeeks, subWeeks, getDay,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { StatusEditModal } from '@/components/shared/StatusEditModal'
import type { Member, StatusEntry, PublicHoliday } from '@/lib/types'

// ── Week always starts on Sunday (weekStartsOn: 0) ───────────────────────────
const WEEK_STARTS_ON = 0 as const   // 0 = Sunday

type ViewMode = '1w' | '2w' | '1m' | '1q'

// Number of days shown per view
const VIEW_DAYS: Record<ViewMode, number> = { '1w': 7, '2w': 14, '1m': 28, '1q': 91 }
// How many weeks to advance/retreat per click
const NAV_WEEKS: Record<ViewMode, number> = { '1w': 1, '2w': 2, '1m': 4, '1q': 13 }
// Column min-width per view (px)
const COL_WIDTH: Record<ViewMode, string> = {
  '1w': 'min-w-20',   // 80px — wide, full text
  '2w': 'min-w-16',   // 64px — comfortable
  '1m': 'min-w-12',   // 48px — compact but readable
  '1q': 'min-w-10',   // 40px — tight; 3-char tags fit fine
}

// Truncate tag name for narrow columns
function tagLabel(name: string, viewMode: ViewMode): string {
  if (viewMode === '1q' && name.length > 5) return name.slice(0, 4) + '…'
  return name
}

export function GanttChart() {
  const [members,  setMembers]  = useState<Member[]>([])
  const [entries,  setEntries]  = useState<StatusEntry[]>([])
  const [holidays, setHolidays] = useState<PublicHoliday[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('1q')
  // Default start: this week's Sunday
  const [startDate, setStartDate] = useState(
    () => startOfWeek(new Date(), { weekStartsOn: WEEK_STARTS_ON })
  )
  const [modalOpen,       setModalOpen]       = useState(false)
  const [selectedMember,  setSelectedMember]  = useState<Member | null>(null)
  const [selectedDate,    setSelectedDate]    = useState<string>('')
  const [editEntry,       setEditEntry]       = useState<StatusEntry | null>(null)

  const days = eachDayOfInterval({ start: startDate, end: addDays(startDate, VIEW_DAYS[viewMode] - 1) })
  const from = format(startDate, 'yyyy-MM-dd')
  const to   = format(addDays(startDate, VIEW_DAYS[viewMode] - 1), 'yyyy-MM-dd')

  const holidayMap = holidays.reduce<Record<string, PublicHoliday>>((acc, h) => {
    acc[h.date] = h; return acc
  }, {})

  const refresh = useCallback(() => {
    fetch('/api/members').then(r => r.json()).then(setMembers)
    fetch(`/api/status?from=${from}&to=${to}`).then(r => r.json()).then(setEntries)
  }, [from, to])

  useEffect(() => { refresh() }, [refresh])

  useEffect(() => {
    // Load holidays for current year and next year (quarter view may span year boundary)
    const year = new Date().getFullYear()
    Promise.all([
      fetch(`/api/holidays?year=${year}`).then(r => r.json()),
      fetch(`/api/holidays?year=${year + 1}`).then(r => r.json()),
    ]).then(([a, b]) => setHolidays([...a, ...b]))
  }, [])

  // Build lookup: memberId_date → StatusEntry
  const entryMap: Record<string, StatusEntry> = {}
  for (const e of entries) {
    const start = new Date(e.startDate + 'T00:00:00')
    const end   = new Date(e.endDate   + 'T00:00:00')
    for (const day of days) {
      if (day >= start && day <= end) {
        entryMap[`${e.memberId}_${format(day, 'yyyy-MM-dd')}`] = e
      }
    }
  }

  function handleCellClick(member: Member, day: Date) {
    const dateStr = format(day, 'yyyy-MM-dd')
    setSelectedMember(member)
    setSelectedDate(dateStr)
    setEditEntry(entryMap[`${member.id}_${dateStr}`] ?? null)
    setModalOpen(true)
  }

  function navigate(dir: 1 | -1) {
    setStartDate(d => (dir === 1 ? addWeeks : subWeeks)(d, NAV_WEEKS[viewMode]))
  }

  // Build month-span groups for the header row
  const monthSpans: { label: string; count: number }[] = []
  for (const day of days) {
    const label = format(day, 'MMM yyyy')
    if (!monthSpans.length || monthSpans[monthSpans.length - 1].label !== label) {
      monthSpans.push({ label, count: 1 })
    } else {
      monthSpans[monthSpans.length - 1].count++
    }
  }

  const isCompact = viewMode === '1m' || viewMode === '1q'
  const colW = COL_WIDTH[viewMode]

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg border hover:bg-gray-50">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium min-w-44 text-center">
            {format(startDate, 'MMM d')} – {format(addDays(startDate, VIEW_DAYS[viewMode] - 1), 'MMM d, yyyy')}
          </span>
          <button onClick={() => navigate(1)} className="p-1.5 rounded-lg border hover:bg-gray-50">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setStartDate(startOfWeek(new Date(), { weekStartsOn: WEEK_STARTS_ON }))}
            className="ml-2 px-2.5 py-1 text-xs border rounded-full hover:bg-gray-50"
          >
            This Week
          </button>
        </div>
        <div className="flex gap-1">
          {([
            { key: '1w', label: '1 Week' },
            { key: '2w', label: '2 Weeks' },
            { key: '1m', label: '1 Month' },
            { key: '1q', label: '1 Quarter' },
          ] as { key: ViewMode; label: string }[]).map(v => (
            <button
              key={v.key}
              onClick={() => setViewMode(v.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                viewMode === v.key ? 'bg-gray-800 text-white border-gray-800' : 'hover:bg-gray-50'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto rounded-xl border">
        <table className="text-xs border-collapse" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-gray-50">
            {/* Month group row */}
            <tr>
              <th className="sticky left-0 z-20 bg-gray-50 border-b border-r w-36" />
              {monthSpans.map((s, i) => (
                <th
                  key={i}
                  colSpan={s.count}
                  className="border-b border-r px-2 py-1 text-center font-semibold text-gray-500 bg-gray-100 text-xs"
                >
                  {s.label}
                </th>
              ))}
            </tr>

            {/* Day header row */}
            <tr>
              <th className="sticky left-0 z-20 bg-gray-50 border-b border-r px-3 py-2 text-left font-medium text-gray-600 w-36">
                Member
              </th>
              {days.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd')
                const holiday = holidayMap[dateStr]
                const weekend = isWeekend(day)
                const isSun   = getDay(day) === 0
                const todayFlag = isToday(day)
                // Sunday gets a left border to visually separate weeks
                const weekBorderClass = isSun ? 'border-l-2 border-l-gray-300' : ''
                return (
                  <th
                    key={dateStr}
                    className={`border-b border-r text-center font-medium ${colW} ${weekBorderClass} ${
                      isCompact ? 'px-0 py-1' : 'px-1 py-2'
                    } ${
                      todayFlag            ? 'bg-blue-50 text-blue-700' :
                      holiday && !holiday.isWorkday ? 'bg-purple-50 text-purple-600' :
                      weekend              ? 'bg-slate-100 text-slate-400' :
                                             'text-gray-600'
                    }`}
                    title={holiday?.name ?? format(day, 'EEE MMM d')}
                  >
                    <div className={isCompact ? 'text-[9px] leading-tight' : 'text-xs'}>
                      {format(day, isCompact ? 'EEEEE' : 'EEE')}
                    </div>
                    <div className={`font-normal ${isCompact ? 'text-[9px] leading-tight text-gray-400' : 'text-gray-400 text-[10px]'}`}>
                      {format(day, isCompact ? 'd' : 'M/d')}
                    </div>
                    {holiday && !holiday.isWorkday && (
                      <div className={`text-purple-400 ${isCompact ? 'text-[8px]' : 'text-[10px]'}`}>🎌</div>
                    )}
                    {holiday?.isWorkday && (
                      <div className={`text-orange-400 ${isCompact ? 'text-[8px]' : 'text-[10px]'}`}>补</div>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody>
            {members.map((member, mIdx) => (
              <tr key={member.id} className={mIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                {/* Sticky member name column */}
                <td className="sticky left-0 z-10 border-r border-b px-3 py-2 font-medium bg-inherit w-36">
                  <div className="truncate">{member.name}</div>
                  {member.scope && (
                    <div className="text-gray-400 font-normal text-[10px] truncate">{member.scope}</div>
                  )}
                </td>

                {days.map(day => {
                  const dateStr   = format(day, 'yyyy-MM-dd')
                  const key       = `${member.id}_${dateStr}`
                  const entry     = entryMap[key]
                  const holiday   = holidayMap[dateStr]
                  const weekend   = isWeekend(day) && !holiday?.isWorkday
                  const isSun     = getDay(day) === 0
                  const todayFlag = isToday(day)
                  const weekBorderClass = isSun ? 'border-l-2 border-l-gray-300' : ''

                  return (
                    <td
                      key={dateStr}
                      onClick={() => !weekend && handleCellClick(member, day)}
                      className={`border-r border-b p-0 ${colW} ${isCompact ? 'h-8' : 'h-10'} ${weekBorderClass} ${
                        weekend
                          ? 'bg-slate-100/80 cursor-default'
                          : 'cursor-pointer hover:brightness-95'
                      } ${todayFlag ? 'ring-1 ring-inset ring-blue-300' : ''}`}
                      title={
                        entry
                          ? `${entry.tagName}${entry.locationName ? ' @ ' + entry.locationName : ''}${entry.notes ? '\n' + entry.notes : ''}`
                          : format(day, 'EEE MMM d')
                      }
                    >
                      {/* Status entry cell */}
                      {entry && (
                        <div
                          className="w-full h-full flex items-center justify-center font-medium leading-none px-0.5 overflow-hidden"
                          style={{
                            backgroundColor: entry.tagColor + '66',
                            color: darken(entry.tagColor ?? '#888'),
                          }}
                        >
                          <span className={`truncate ${isCompact ? 'text-[9px]' : 'text-[11px]'}`}>
                            {tagLabel(entry.tagName ?? '', viewMode)}
                          </span>
                        </div>
                      )}

                      {/* Public holiday cell (no entry needed) */}
                      {!entry && holiday && !holiday.isWorkday && !weekend && (
                        <div className="w-full h-full flex items-center justify-center bg-purple-100/70">
                          <span className={`text-purple-500 font-medium ${isCompact ? 'text-[9px]' : 'text-[11px]'}`}>
                            {isCompact ? '🎌' : '🎌 Holiday'}
                          </span>
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-slate-100 border border-slate-300" /> Weekend (Sun/Sat)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-purple-100 border border-purple-300" /> Public Holiday
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-blue-50 border border-blue-300 ring-1 ring-blue-300" /> Today
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-0.5 h-3 bg-gray-400" /> Week boundary (every Sunday)
        </span>
        <span className="text-gray-400">· Click any weekday cell to add/edit status</span>
      </div>

      <StatusEditModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={refresh}
        member={selectedMember}
        prefillDate={selectedDate}
        editEntry={editEntry}
      />
    </div>
  )
}

function darken(hex: string): string {
  if (!hex || hex.length < 7) return '#333'
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - 80)
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - 80)
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - 80)
  return `rgb(${r},${g},${b})`
}
