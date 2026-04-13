'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  format, addDays, startOfWeek, eachDayOfInterval, isToday,
  isWeekend, getDay, addWeeks, subWeeks, parseISO,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Zap, X, Check } from 'lucide-react'
import type { Member, Tag, Location, StatusEntry } from '@/lib/types'

const WEEK_STARTS_ON = 0 as const  // Sunday

interface PendingEntry {
  key:          string   // unique key for dedup
  startDate:    string
  endDate:      string
  tagId:        string
  tagName:      string
  tagColor:     string
  locationId:   string | null
  locationName: string | null
  notes:        string
}

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
}

const CATEGORY_LABELS: Record<string, string> = {
  office:    'Office / GTD',
  onsite_cm: 'On-site CM',
  wfh:       'WFH',
  leave:     'Leave',
  holiday:   'Holiday',
  vn:        'VN (Overseas)',
}

export function QuickFillDrawer({ open, onClose, onSaved }: Props) {
  // ── Data ──────────────────────────────────────────────────────────────────
  const [members,        setMembers]        = useState<Member[]>([])
  const [tags,           setTags]           = useState<Tag[]>([])
  const [locations,      setLocations]      = useState<Location[]>([])
  const [todayEntries,   setTodayEntries]   = useState<StatusEntry[]>([])

  // ── Selection state ───────────────────────────────────────────────────────
  const [memberId,       setMemberId]       = useState<string>('')
  const [selectionMode,  setSelectionMode]  = useState<'day' | 'range'>('day')
  const [weekStart,      setWeekStart]      = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: WEEK_STARTS_ON })
  )
  const [selectedDates,  setSelectedDates]  = useState<string[]>([])  // sorted YYYY-MM-DD
  const [dragStart,      setDragStart]      = useState<string | null>(null)
  const [isDragging,     setIsDragging]     = useState(false)
  // Range mode
  const [rangeFrom,      setRangeFrom]      = useState<string>('')
  const [rangeTo,        setRangeTo]        = useState<string>('')

  // ── Entry builder ─────────────────────────────────────────────────────────
  const [selectedTagId,  setSelectedTagId]  = useState<string>('')
  const [locationId,     setLocationId]     = useState<string>('')
  const [notes,          setNotes]          = useState<string>('')

  // ── Pending list ──────────────────────────────────────────────────────────
  const [pending,        setPending]        = useState<PendingEntry[]>([])
  const [saving,         setSaving]         = useState(false)

  const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) })

  // Load reference data
  useEffect(() => {
    if (!open) return
    fetch('/api/members').then(r => r.json()).then(setMembers)
    fetch('/api/tags').then(r => r.json()).then(setTags)
    fetch('/api/locations').then(r => r.json()).then(setLocations)
  }, [open])

  // Load entries for current member when week/member changes
  useEffect(() => {
    if (!memberId || !open) return
    const from = format(weekStart, 'yyyy-MM-dd')
    const to   = format(addDays(weekStart, 6), 'yyyy-MM-dd')
    fetch(`/api/status?member_id=${memberId}`)
      .then(r => r.json())
      .then((all: StatusEntry[]) => {
        // filter to what overlaps with current week
        setTodayEntries(all.filter(e => e.startDate <= to && e.endDate >= from))
      })
  }, [memberId, weekStart, open])

  // Reset selection when drawer closes
  useEffect(() => {
    if (!open) {
      setSelectedDates([])
      setRangeFrom('')
      setRangeTo('')
      setSelectedTagId('')
      setLocationId('')
      setNotes('')
      setPending([])
    }
  }, [open])

  // ── Helpers ───────────────────────────────────────────────────────────────
  function getEntryForDate(dateStr: string): StatusEntry | undefined {
    return todayEntries.find(e => e.startDate <= dateStr && e.endDate >= dateStr)
  }

  function getStatusForDate(dateStr: string) {
    // Check pending first
    const p = pending.find(p => p.startDate <= dateStr && p.endDate >= dateStr)
    if (p) return { tagColor: p.tagColor, tagName: p.tagName, isPending: true }
    const e = getEntryForDate(dateStr)
    if (e) return { tagColor: e.tagColor ?? '', tagName: e.tagName ?? '', isPending: false }
    return null
  }

  // ── Day selection (click + drag) ──────────────────────────────────────────
  function handleDayMouseDown(dateStr: string) {
    if (isWeekend(parseISO(dateStr))) return
    setIsDragging(true)
    setDragStart(dateStr)
    setSelectedDates([dateStr])
    setSelectedTagId('')
    setLocationId('')
  }

  function handleDayMouseEnter(dateStr: string) {
    if (!isDragging || !dragStart || isWeekend(parseISO(dateStr))) return
    // Build range from dragStart to dateStr
    const start = dragStart < dateStr ? dragStart : dateStr
    const end   = dragStart < dateStr ? dateStr   : dragStart
    const range = eachDayOfInterval({
      start: parseISO(start), end: parseISO(end)
    }).filter(d => !isWeekend(d)).map(d => format(d, 'yyyy-MM-dd'))
    setSelectedDates(range)
  }

  function handleMouseUp() { setIsDragging(false) }

  // ── Derived values ────────────────────────────────────────────────────────
  const selectedTag  = tags.find(t => t.id === selectedTagId)
  const needsLocation = selectedTag
    ? ['office', 'onsite_cm', 'vn'].includes(selectedTag.category)
    : false

  const filteredLocations = (() => {
    if (!selectedTag) return locations
    if (selectedTag.category === 'office')    return locations.filter(l => l.type === 'office')
    if (selectedTag.category === 'onsite_cm') return locations.filter(l => l.type === 'cm_site')
    if (selectedTag.category === 'vn')        return locations.filter(l => l.type === 'overseas' || l.type === 'cm_site')
    return locations
  })()

  const tagsByCategory = tags.reduce<Record<string, Tag[]>>((acc, t) => {
    if (!acc[t.category]) acc[t.category] = []
    acc[t.category].push(t)
    return acc
  }, {})

  // Unified selection info across both modes
  const activeStart = selectionMode === 'range' ? rangeFrom : selectedDates[0] ?? ''
  const activeEnd   = selectionMode === 'range' ? rangeTo   : selectedDates[selectedDates.length - 1] ?? ''
  const hasSelection = selectionMode === 'range'
    ? (rangeFrom !== '' && rangeTo !== '' && rangeFrom <= rangeTo)
    : selectedDates.length > 0

  const selectionLabel = (() => {
    if (!hasSelection) return null
    if (activeStart === activeEnd) return format(parseISO(activeStart), 'EEE MMM d')
    return `${format(parseISO(activeStart), 'MMM d')} – ${format(parseISO(activeEnd), 'MMM d')}`
  })()

  const canApply = hasSelection && selectedTagId !== '' && (!needsLocation || locationId !== '')

  // ── Apply pending entry ───────────────────────────────────────────────────
  function handleApply() {
    if (!canApply || !selectedTag) return
    const loc   = locations.find(l => l.id === locationId)
    const start = activeStart
    const end   = activeEnd
    const key   = `${start}_${end}_${selectedTagId}`
    setPending(prev => {
      const filtered = prev.filter(p => p.key !== key)
      return [...filtered, {
        key, startDate: start, endDate: end,
        tagId: selectedTagId, tagName: selectedTag.name, tagColor: selectedTag.colorHex,
        locationId: locationId || null, locationName: loc?.name ?? null, notes,
      }]
    })
    // Reset selection area but keep tag/location for convenience
    setSelectedDates([])
    setRangeFrom('')
    setRangeTo('')
    setNotes('')
  }

  // ── Save all ──────────────────────────────────────────────────────────────
  async function handleSaveAll() {
    if (!memberId || !pending.length) return
    setSaving(true)
    await Promise.all(pending.map(p =>
      fetch('/api/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId, tagId: p.tagId, locationId: p.locationId,
          startDate: p.startDate, endDate: p.endDate, notes: p.notes || null,
        }),
      })
    ))
    setSaving(false)
    setPending([])
    onSaved()
    onClose()
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-[420px] sm:w-[480px] overflow-y-auto p-0"
        onMouseUp={handleMouseUp}
      >
        <SheetHeader className="px-5 py-4 border-b sticky top-0 bg-white z-10">
          <SheetTitle className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Quick Fill
          </SheetTitle>
        </SheetHeader>

        <div className="px-5 py-4 space-y-5">

          {/* ── Step 1: Who are you ── */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Step 1 — Who are you?
            </Label>
            <Select value={memberId} onValueChange={v => v && setMemberId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your name…" />
              </SelectTrigger>
              <SelectContent>
                {members.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{m.name}</span>
                      {m.scope && <span className="text-gray-400 text-xs">{m.scope}</span>}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {memberId && (
            <>
              {/* ── Step 2: Select days ── */}
              <div className="space-y-2">
                {/* Mode toggle + label row */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Step 2 — Select days
                  </Label>
                  <div className="flex rounded-lg border overflow-hidden text-xs">
                    <button
                      onClick={() => { setSelectionMode('day'); setRangeFrom(''); setRangeTo('') }}
                      className={`px-3 py-1.5 transition-colors ${
                        selectionMode === 'day'
                          ? 'bg-gray-800 text-white'
                          : 'bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      By Day
                    </button>
                    <button
                      onClick={() => { setSelectionMode('range'); setSelectedDates([]) }}
                      className={`px-3 py-1.5 border-l transition-colors ${
                        selectionMode === 'range'
                          ? 'bg-gray-800 text-white'
                          : 'bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      By Range
                    </button>
                  </div>
                </div>

                {/* ── Range mode UI ── */}
                {selectionMode === 'range' && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400">
                      Pick a start and end date — the same status will apply to the entire period.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">From</Label>
                        <Input
                          type="date"
                          value={rangeFrom}
                          onChange={e => {
                            setRangeFrom(e.target.value)
                            if (rangeTo && e.target.value > rangeTo) setRangeTo(e.target.value)
                          }}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">To</Label>
                        <Input
                          type="date"
                          value={rangeTo}
                          min={rangeFrom}
                          onChange={e => setRangeTo(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    {rangeFrom && rangeTo && rangeFrom <= rangeTo && (
                      <p className="text-xs text-blue-600 font-medium">
                        Selected: {format(parseISO(rangeFrom), 'MMM d')} – {format(parseISO(rangeTo), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                )}

                {/* ── Day mode UI ── */}
                {selectionMode === 'day' && (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">Click a day or drag across multiple days to select</p>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setWeekStart(d => subWeeks(d, 1))} className="p-1 rounded hover:bg-gray-100">
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs text-gray-500 min-w-28 text-center">
                          {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d')}
                        </span>
                        <button onClick={() => setWeekStart(d => addWeeks(d, 1))} className="p-1 rounded hover:bg-gray-100">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 7-day strip */}
                    <div className="grid grid-cols-7 gap-1 select-none" onMouseLeave={() => isDragging && setIsDragging(false)}>
                      {days.map(day => {
                        const dateStr   = format(day, 'yyyy-MM-dd')
                        const weekend   = isWeekend(day)
                        const todayFlag = isToday(day)
                        const selected  = selectedDates.includes(dateStr)
                        const status    = getStatusForDate(dateStr)
                        return (
                          <div
                            key={dateStr}
                            onMouseDown={() => handleDayMouseDown(dateStr)}
                            onMouseEnter={() => handleDayMouseEnter(dateStr)}
                            className={`
                              relative rounded-lg border-2 text-center py-2 transition-all
                              ${weekend
                                ? 'bg-slate-50 border-slate-100 cursor-default opacity-50'
                                : selected
                                  ? 'border-blue-500 bg-blue-50 cursor-pointer'
                                  : 'border-transparent hover:border-gray-200 cursor-pointer'}
                              ${todayFlag && !selected ? 'ring-1 ring-blue-300' : ''}
                            `}
                            title={dateStr}
                          >
                            <div className={`text-[10px] font-medium ${selected ? 'text-blue-600' : 'text-gray-400'}`}>
                              {format(day, 'EEE')}
                            </div>
                            <div className={`text-sm font-bold ${selected ? 'text-blue-700' : todayFlag ? 'text-blue-500' : 'text-gray-700'}`}>
                              {format(day, 'd')}
                            </div>
                            {status && (
                              <div
                                className="mt-1 mx-auto rounded-full text-[8px] font-medium px-1 truncate"
                                style={{
                                  backgroundColor: status.tagColor + '44',
                                  color: darken(status.tagColor),
                                  border: `1px solid ${status.tagColor}`,
                                  opacity: status.isPending ? 1 : 0.8,
                                }}
                              >
                                {status.tagName.slice(0, 4)}
                              </div>
                            )}
                            {status?.isPending && (
                              <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Multi-week quick links */}
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { label: 'This week',       weeks: 0 },
                        { label: 'Next week',       weeks: 1 },
                        { label: 'Week after next', weeks: 2 },
                      ].map(({ label, weeks }) => {
                        const ws = addWeeks(startOfWeek(new Date(), { weekStartsOn: WEEK_STARTS_ON }), weeks)
                        const isCurrent = format(ws, 'yyyy-MM-dd') === format(weekStart, 'yyyy-MM-dd')
                        return (
                          <button
                            key={label}
                            onClick={() => setWeekStart(ws)}
                            className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                              isCurrent ? 'bg-gray-800 text-white border-gray-800' : 'text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {label}
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* ── Step 3: Pick status (shown after days selected) ── */}
              {hasSelection && (
                <div className="space-y-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                      Step 3 — Status for {selectionLabel}
                    </Label>
                    <button
                      onClick={() => { setSelectedDates([]); setRangeFrom(''); setRangeTo('') }}
                      className="text-blue-400 hover:text-blue-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Tag grid grouped by category */}
                  <div className="space-y-2">
                    {Object.entries(tagsByCategory).map(([cat, catTags]) => (
                      <div key={cat}>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">
                          {CATEGORY_LABELS[cat] ?? cat}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {catTags.map(t => (
                            <button
                              key={t.id}
                              onClick={() => { setSelectedTagId(t.id); setLocationId('') }}
                              className={`px-2.5 py-1 rounded-full text-xs font-medium border-2 transition-all ${
                                selectedTagId === t.id
                                  ? 'border-gray-800 scale-105 shadow-sm'
                                  : 'border-transparent hover:border-gray-300'
                              }`}
                              style={{
                                backgroundColor: t.colorHex + '44',
                                color: darken(t.colorHex),
                              }}
                            >
                              {selectedTagId === t.id && <Check className="w-3 h-3 inline mr-1" />}
                              {t.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Location picker (conditional) */}
                  {needsLocation && (
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600">Location *</Label>
                      <Select value={locationId} onValueChange={v => v && setLocationId(v)}>
                        <SelectTrigger className="bg-white h-8 text-xs">
                          <SelectValue placeholder="Select location…" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredLocations.map(l => (
                            <SelectItem key={l.id} value={l.id} className="text-xs">{l.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Notes */}
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Notes (optional)</Label>
                    <Input
                      className="bg-white h-8 text-xs"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="e.g., GTK quarterly review"
                    />
                  </div>

                  {/* Apply button */}
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={!canApply}
                    onClick={handleApply}
                  >
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                    {selectionMode === 'range'
                      ? 'Apply to selected period'
                      : `Apply to ${selectedDates.length} day${selectedDates.length > 1 ? 's' : ''}`
                    }
                  </Button>
                </div>
              )}

              {/* ── Pending list ── */}
              {pending.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Pending changes ({pending.length})
                  </Label>
                  <div className="space-y-1.5">
                    {pending.map(p => (
                      <div
                        key={p.key}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 border"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: p.tagColor }}
                          />
                          <div>
                            <span className="text-xs font-medium">{p.tagName}</span>
                            {p.locationName && (
                              <span className="text-xs text-gray-400"> @ {p.locationName}</span>
                            )}
                            <div className="text-[10px] text-gray-400">
                              {p.startDate === p.endDate
                                ? format(parseISO(p.startDate), 'EEE MMM d')
                                : `${format(parseISO(p.startDate), 'MMM d')} – ${format(parseISO(p.endDate), 'MMM d')}`
                              }
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setPending(prev => prev.filter(x => x.key !== p.key))}
                          className="text-gray-300 hover:text-red-400 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer: Save All ── */}
        {pending.length > 0 && (
          <div className="sticky bottom-0 bg-white border-t px-5 py-4">
            <Button
              className="w-full"
              size="lg"
              onClick={handleSaveAll}
              disabled={saving}
            >
              {saving ? 'Saving…' : `Save All ${pending.length} entr${pending.length > 1 ? 'ies' : 'y'}`}
            </Button>
            <p className="text-xs text-center text-gray-400 mt-1.5">
              All entries will be created for {members.find(m => m.id === memberId)?.name}
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function darken(hex: string): string {
  if (!hex || hex.length < 7) return '#333'
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - 80)
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - 80)
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - 80)
  return `rgb(${r},${g},${b})`
}
