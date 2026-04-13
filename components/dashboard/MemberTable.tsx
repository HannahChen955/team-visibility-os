'use client'

import { useEffect, useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { StatusEditModal } from '@/components/shared/StatusEditModal'
import type { Member, StatusEntry, RTOSummary, Tag } from '@/lib/types'
import { format } from 'date-fns'

const STATUS_FILTERS = [
  { label: 'All',        value: 'all' },
  { label: 'Office/GTD', value: 'office' },
  { label: 'On-site CM', value: 'onsite_cm' },
  { label: 'WFH',        value: 'wfh' },
  { label: 'Leave',      value: 'leave' },
  { label: 'VN',         value: 'vn' },
  { label: 'No Status',  value: 'none' },
]

const BASE_FILTERS = ['All', 'Shanghai', 'Shenzhen', 'Suzhou']

const RTO_COLORS: Record<string, string> = {
  complete: 'text-green-600',
  on_track: 'text-green-500',
  at_risk:  'text-amber-500',
  not_met:  'text-red-500',
}

export function MemberTable() {
  const [members,      setMembers]      = useState<Member[]>([])
  const [todayEntries, setTodayEntries] = useState<StatusEntry[]>([])
  const [rtoData,      setRtoData]      = useState<RTOSummary[]>([])
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [baseFilter,   setBaseFilter]   = useState('All')
  const [modalOpen,    setModalOpen]    = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [editEntry,    setEditEntry]    = useState<StatusEntry | null>(null)

  const today = format(new Date(), 'yyyy-MM-dd')

  const refresh = useCallback(() => {
    fetch('/api/members').then(r => r.json()).then(setMembers)
    fetch(`/api/status?date=${today}`).then(r => r.json()).then(setTodayEntries)
    fetch('/api/rto').then(r => r.json()).then(setRtoData)
  }, [today])

  useEffect(() => { refresh() }, [refresh])

  const entryByMember = todayEntries.reduce<Record<string, StatusEntry>>((acc, e) => {
    acc[e.memberId] = e
    return acc
  }, {})

  const rtoByMember = rtoData.reduce<Record<string, RTOSummary>>((acc, r) => {
    acc[r.memberId] = r
    return acc
  }, {})

  const filtered = members.filter(m => {
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) &&
        !(m.scope ?? '').toLowerCase().includes(search.toLowerCase())) return false
    if (baseFilter !== 'All' && m.baseLocation !== baseFilter) return false
    if (statusFilter !== 'all') {
      const entry = entryByMember[m.id]
      if (statusFilter === 'none') return !entry
      if (!entry) return false
      return entry.tagCategory === statusFilter
    }
    return true
  })

  function openAdd(member: Member) {
    setSelectedMember(member)
    setEditEntry(null)
    setModalOpen(true)
  }

  function openEdit(member: Member, entry: StatusEntry) {
    setSelectedMember(member)
    setEditEntry(entry)
    setModalOpen(true)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          className="w-48"
          placeholder="Search name or scope…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-1 flex-wrap">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                statusFilter === f.value
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {BASE_FILTERS.map(b => (
            <button
              key={b}
              onClick={() => setBaseFilter(b)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                baseFilter === b
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-40">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-32">Scope</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-24">Base</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-36">Today's Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-36">Location</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-36">Date Range</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-28">RTO Week</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-28">RTO Month</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((member, idx) => {
              const entry = entryByMember[member.id]
              const rto   = rtoByMember[member.id]
              return (
                <tr
                  key={member.id}
                  className={`border-b last:border-0 cursor-pointer hover:bg-gray-50 transition-colors ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  }`}
                  onClick={() => entry ? openEdit(member, entry) : openAdd(member)}
                >
                  <td className="px-4 py-3 font-medium">{member.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{member.scope ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{member.baseLocation}</td>
                  <td className="px-4 py-3">
                    {entry ? (
                      <StatusBadge name={entry.tagName!} colorHex={entry.tagColor!} size="sm" />
                    ) : (
                      <span className="text-gray-300 text-xs">No entry</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{entry?.locationName ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {entry ? `${entry.startDate} – ${entry.endDate}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {rto ? (
                      <span className={`font-medium text-xs ${RTO_COLORS[rto.status]}`}>
                        {rto.weekRtoCount}/{rto.weekRtoRequired}d
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {rto ? (
                      <span className={`font-medium text-xs ${RTO_COLORS[rto.status]}`}>
                        {rto.monthRtoCount}/{rto.monthRtoRequired}d
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">No members match current filters</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <StatusEditModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={refresh}
        member={selectedMember}
        prefillDate={today}
        editEntry={editEntry}
      />
    </div>
  )
}
