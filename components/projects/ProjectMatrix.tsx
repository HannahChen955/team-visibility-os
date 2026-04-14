'use client'

import { useEffect, useState, useCallback } from 'react'
import { X } from 'lucide-react'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTH_KEYS = ['01','02','03','04','05','06','07','08','09','10','11','12']

interface Project {
  id: string
  name: string
  colorHex: string
  description?: string | null
}

interface Member {
  id: string
  name: string
  scope?: string | null
  baseLocation: string
}

interface Assignment {
  id: string
  projectId: string
  memberId: string
  month: string
  role: 'dri' | 'support'
  projectName?: string | null
  projectColor?: string | null
  memberName?: string | null
}

type ViewMode = 'by-project' | 'by-person'

// ── Cell popup for adding/removing assignments ─────────────────────────────
interface CellPopupProps {
  year: number
  monthIdx: number
  rowId: string        // projectId (by-project) or memberId (by-person)
  viewMode: ViewMode
  projects: Project[]
  members: Member[]
  existing: Assignment[]
  onClose: () => void
  onRefresh: () => void
}

function CellPopup({ year, monthIdx, rowId, viewMode, projects, members, existing, onClose, onRefresh }: CellPopupProps) {
  const month = `${year}-${MONTH_KEYS[monthIdx]}`

  async function toggle(otherId: string, currentRole: 'dri' | 'support' | null) {
    const projectId = viewMode === 'by-project' ? rowId : otherId
    const memberId  = viewMode === 'by-project' ? otherId : rowId

    if (currentRole === null) {
      // Add as support
      await fetch('/api/project-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, memberId, month, role: 'support' }),
      })
    } else if (currentRole === 'support') {
      // Promote to DRI
      await fetch('/api/project-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, memberId, month, role: 'dri' }),
      })
    } else {
      // Remove
      await fetch(`/api/project-assignments?project_id=${projectId}&member_id=${memberId}&month=${month}`, {
        method: 'DELETE',
      })
    }
    onRefresh()
  }

  const items = viewMode === 'by-project' ? members : projects
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl border p-4 w-72 max-h-96 overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700">
            {MONTHS[monthIdx]} {year}
          </span>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-400" /></button>
        </div>
        <p className="text-xs text-gray-400 mb-3">Click to cycle: none → Support → DRI → remove</p>
        <div className="space-y-1.5">
          {items.map(item => {
            const asgn = existing.find(a =>
              viewMode === 'by-project'
                ? a.memberId === item.id
                : a.projectId === item.id
            )
            const role = asgn?.role ?? null
            const color = viewMode === 'by-project'
              ? '#6b7280'
              : (item as Project).colorHex
            return (
              <button
                key={item.id}
                onClick={() => toggle(item.id, role)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-colors hover:bg-gray-50"
                style={role ? { borderColor: color, backgroundColor: color + '22' } : {}}
              >
                <span className="font-medium text-gray-700">{item.name}</span>
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                  style={role ? { backgroundColor: color, color: '#fff' } : { color: '#9ca3af' }}
                >
                  {role === 'dri' ? '★ DRI' : role === 'support' ? 'Support' : '—'}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Chip component ─────────────────────────────────────────────────────────
function Chip({ label, color, role }: { label: string; color: string; role: 'dri' | 'support' }) {
  if (role === 'dri') {
    return (
      <span
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap"
        style={{ backgroundColor: color, color: darken(color) }}
      >
        ★ {label}
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap border"
      style={{ borderColor: color, color: darken(color), backgroundColor: color + '33' }}
    >
      {label}
    </span>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────
export function ProjectMatrix() {
  const [projects,    setProjects]    = useState<Project[]>([])
  const [members,     setMembers]     = useState<Member[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [viewMode,    setViewMode]    = useState<ViewMode>('by-project')
  const [year,        setYear]        = useState(2026)
  const [popup,       setPopup]       = useState<{ rowId: string; monthIdx: number } | null>(null)

  const loadAssignments = useCallback(() => {
    fetch(`/api/project-assignments?year=${year}`).then(r => r.json()).then(setAssignments)
  }, [year])

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(setProjects)
    fetch('/api/members').then(r => r.json()).then(setMembers)
  }, [])

  useEffect(() => { loadAssignments() }, [loadAssignments])

  // Build lookup: "projectId_memberId_YYYY-MM" → Assignment
  const aMap: Record<string, Assignment> = {}
  for (const a of assignments) {
    aMap[`${a.projectId}_${a.memberId}_${a.month}`] = a
  }

  const rows    = viewMode === 'by-project' ? projects : members
  const colKeys = MONTH_KEYS.map(m => `${year}-${m}`)

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Year</span>
          {[2025, 2026, 2027].map(y => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                year === y ? 'bg-gray-800 text-white border-gray-800' : 'hover:bg-gray-50'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg border overflow-hidden text-xs">
          <button
            onClick={() => setViewMode('by-project')}
            className={`px-3 py-1.5 transition-colors ${viewMode === 'by-project' ? 'bg-gray-800 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >
            By Project
          </button>
          <button
            onClick={() => setViewMode('by-person')}
            className={`px-3 py-1.5 border-l transition-colors ${viewMode === 'by-person' ? 'bg-gray-800 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >
            By Person
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-400 text-white">★ DRI</span>
          Directly Responsible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded text-[10px] border border-blue-400 text-blue-700">Support</span>
          Supporting member
        </span>
        <span className="text-gray-400">· Click any cell to assign / change roles</span>
      </div>

      {/* Matrix */}
      <div className="overflow-x-auto rounded-xl border">
        <table className="text-xs border-collapse w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="sticky left-0 z-20 bg-gray-50 border-b border-r px-3 py-2 text-left font-medium text-gray-600 w-44">
                {viewMode === 'by-project' ? 'Project' : 'Member'}
              </th>
              {MONTHS.map((m, i) => (
                <th key={m} className="border-b border-r px-2 py-2 text-center font-medium text-gray-500 min-w-20">
                  {m}
                </th>
              ))}
              <th className="border-b px-2 py-2 text-center font-medium text-gray-500 w-12">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rIdx) => {
              const rowAssignments = assignments.filter(a =>
                viewMode === 'by-project' ? a.projectId === row.id : a.memberId === row.id
              )
              const totalMonths = new Set(rowAssignments.map(a => a.month)).size

              return (
                <tr key={row.id} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  {/* Row label */}
                  <td className="sticky left-0 z-10 border-r border-b px-3 py-2 bg-inherit w-44">
                    <div className="flex items-center gap-2">
                      {viewMode === 'by-project' && (
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: (row as Project).colorHex }}
                        />
                      )}
                      <div>
                        <div className="font-medium text-gray-800 truncate max-w-36">{row.name}</div>
                        {viewMode === 'by-person' && (row as Member).scope && (
                          <div className="text-[10px] text-gray-400 truncate">{(row as Member).scope}</div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Month cells */}
                  {colKeys.map((monthKey, mIdx) => {
                    const cellAssignments = viewMode === 'by-project'
                      ? assignments.filter(a => a.projectId === row.id && a.month === monthKey)
                      : assignments.filter(a => a.memberId  === row.id && a.month === monthKey)

                    return (
                      <td
                        key={monthKey}
                        className="border-r border-b px-1 py-1 min-w-20 h-12 cursor-pointer hover:bg-blue-50/50 transition-colors align-top"
                        onClick={() => setPopup({ rowId: row.id, monthIdx: mIdx })}
                      >
                        <div className="flex flex-wrap gap-0.5">
                          {cellAssignments
                            .sort((a, b) => (a.role === 'dri' ? -1 : 1))
                            .map(a => {
                              const label = viewMode === 'by-project'
                                ? (a.memberName ?? '?').split(' ').pop() ?? '?'  // last name / short
                                : (a.projectName ?? '?').split(' ')[0]           // first word of project
                              const color = viewMode === 'by-project'
                                ? '#6b7280'
                                : (a.projectColor ?? '#93c5fd')
                              return (
                                <Chip key={a.id} label={label} color={color} role={a.role as 'dri' | 'support'} />
                              )
                            })
                          }
                        </div>
                      </td>
                    )
                  })}

                  {/* Total active months */}
                  <td className="border-b px-2 py-2 text-center text-gray-400 font-medium">
                    {totalMonths > 0 ? totalMonths : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Cell popup */}
      {popup && (
        <CellPopup
          year={year}
          monthIdx={popup.monthIdx}
          rowId={popup.rowId}
          viewMode={viewMode}
          projects={projects}
          members={members}
          existing={assignments.filter(a =>
            viewMode === 'by-project'
              ? a.projectId === popup.rowId && a.month === `${year}-${MONTH_KEYS[popup.monthIdx]}`
              : a.memberId  === popup.rowId && a.month === `${year}-${MONTH_KEYS[popup.monthIdx]}`
          )}
          onClose={() => setPopup(null)}
          onRefresh={() => { loadAssignments(); setPopup(null) }}
        />
      )}
    </div>
  )
}

function darken(hex: string): string {
  if (!hex || hex.length < 7) return '#333'
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - 70)
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - 70)
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - 70)
  return `rgb(${r},${g},${b})`
}
