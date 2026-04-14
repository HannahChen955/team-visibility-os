'use client'

import { useEffect, useState, useCallback } from 'react'
import { AssignmentDrawer } from './AssignmentDrawer'

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
  startMonth: string
  endMonth: string
  role: 'dri' | 'support'
  projectName?: string | null
  projectColor?: string | null
  memberName?: string | null
}

type ViewMode = 'by-project' | 'by-person'

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

  // Drawer state
  const [drawer, setDrawer] = useState<{
    open: boolean
    mode: 'project' | 'member'
    targetId: string
    targetName: string
    targetColor?: string
  }>({ open: false, mode: 'project', targetId: '', targetName: '' })

  const loadAssignments = useCallback(() => {
    fetch(`/api/project-assignments?year=${year}`).then(r => r.json()).then(setAssignments)
  }, [year])

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(setProjects)
    fetch('/api/members').then(r => r.json()).then(setMembers)
  }, [])

  useEffect(() => { loadAssignments() }, [loadAssignments])

  function openDrawer(row: Project | Member) {
    if (viewMode === 'by-project') {
      const p = row as Project
      setDrawer({ open: true, mode: 'project', targetId: p.id, targetName: p.name, targetColor: p.colorHex })
    } else {
      const m = row as Member
      setDrawer({ open: true, mode: 'member', targetId: m.id, targetName: m.name })
    }
  }

  const rows    = viewMode === 'by-project' ? projects : members
  const colKeys = MONTH_KEYS.map(m => `${year}-${m}`)

  // Count unique active months for a set of range assignments
  function countActiveMonths(rowAssignments: Assignment[]): number {
    const active = new Set<string>()
    for (const a of rowAssignments) {
      for (const mk of colKeys) {
        if (mk >= a.startMonth && mk <= a.endMonth) active.add(mk)
      }
    }
    return active.size
  }

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
        <span className="text-gray-400">· Click row header to edit assignments</span>
      </div>

      {/* Matrix */}
      <div className="overflow-x-auto rounded-xl border">
        <table className="text-xs border-collapse w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="sticky left-0 z-20 bg-gray-50 border-b border-r px-3 py-2 text-left font-medium text-gray-600 w-44">
                {viewMode === 'by-project' ? 'Project' : 'Member'}
              </th>
              {MONTHS.map(m => (
                <th key={m} className="border-b border-r px-2 py-2 text-center font-medium text-gray-500 min-w-20">
                  {m}
                </th>
              ))}
              <th className="border-b px-2 py-2 text-center font-medium text-gray-500 w-12">Months</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rIdx) => {
              const rowAssignments = assignments.filter(a =>
                viewMode === 'by-project' ? a.projectId === row.id : a.memberId === row.id
              )
              const totalMonths = countActiveMonths(rowAssignments)

              return (
                <tr key={row.id} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  {/* Row label — click to open drawer */}
                  <td
                    className="sticky left-0 z-10 border-r border-b px-3 py-2 bg-inherit w-44 cursor-pointer hover:bg-blue-50 transition-colors group"
                    onClick={() => openDrawer(row)}
                    title="Click to edit assignments"
                  >
                    <div className="flex items-center gap-2">
                      {viewMode === 'by-project' && (
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: (row as Project).colorHex }}
                        />
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-gray-800 truncate max-w-36 group-hover:text-blue-700 transition-colors">
                          {row.name}
                        </div>
                        {viewMode === 'by-person' && (row as Member).scope && (
                          <div className="text-[10px] text-gray-400 truncate">{(row as Member).scope}</div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Month cells — read-only display */}
                  {colKeys.map(monthKey => {
                    const cellAssignments = rowAssignments.filter(a =>
                      monthKey >= a.startMonth && monthKey <= a.endMonth
                    )

                    return (
                      <td
                        key={monthKey}
                        className="border-r border-b px-1 py-1 min-w-20 h-12 align-top"
                      >
                        <div className="flex flex-wrap gap-0.5">
                          {cellAssignments
                            .sort((a, b) => (a.role === 'dri' ? -1 : 1))
                            .map(a => {
                              const label = viewMode === 'by-project'
                                ? (a.memberName ?? '?').split(' ').pop() ?? '?'
                                : (a.projectName ?? '?').split(' ')[0]
                              const color = viewMode === 'by-project'
                                ? '#6b7280'
                                : (a.projectColor ?? '#93c5fd')
                              return (
                                <Chip key={a.id} label={label} color={color} role={a.role} />
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

      {/* Assignment Drawer */}
      <AssignmentDrawer
        open={drawer.open}
        onClose={() => setDrawer(d => ({ ...d, open: false }))}
        onRefresh={() => { loadAssignments(); setDrawer(d => ({ ...d, open: false })) }}
        mode={drawer.mode}
        targetId={drawer.targetId}
        targetName={drawer.targetName}
        targetColor={drawer.targetColor}
        year={year}
        allProjects={projects}
        allMembers={members}
      />
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
