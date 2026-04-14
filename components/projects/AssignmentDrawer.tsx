'use client'

import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Star } from 'lucide-react'
import { nanoid } from 'nanoid'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTH_KEYS = ['01','02','03','04','05','06','07','08','09','10','11','12']

function monthLabel(ym: string) {
  const [y, m] = ym.split('-')
  return `${MONTHS[parseInt(m) - 1]} ${y}`
}

interface Project  { id: string; name: string; colorHex: string }
interface Member   { id: string; name: string; scope?: string | null }
interface Assignment {
  id: string
  projectId: string; memberId: string
  startMonth: string; endMonth: string
  role: 'dri' | 'support'
  projectName?: string | null; projectColor?: string | null
  memberName?: string | null
}

interface Props {
  open:       boolean
  onClose:    () => void
  onRefresh:  () => void
  mode:       'project' | 'member'
  targetId:   string
  targetName: string
  targetColor?: string
  year:       number
  allProjects: Project[]
  allMembers:  Member[]
}

interface DraftRow {
  _key:       string   // local only
  id?:        string   // set after save
  otherId:    string   // memberId (project mode) or projectId (member mode)
  startMonth: string
  endMonth:   string
  role:       'dri' | 'support'
  dirty:      boolean
  isNew:      boolean
}

function monthOptions(year: number) {
  return MONTH_KEYS.map(m => ({ value: `${year}-${m}`, label: `${MONTHS[parseInt(m)-1]}` }))
}

export function AssignmentDrawer({
  open, onClose, onRefresh,
  mode, targetId, targetName, targetColor,
  year, allProjects, allMembers,
}: Props) {
  const [rows,    setRows]    = useState<DraftRow[]>([])
  const [saving,  setSaving]  = useState(false)
  const options = monthOptions(year)

  // Load existing assignments when opened
  useEffect(() => {
    if (!open || !targetId) return
    const param = mode === 'project' ? `project_id=${targetId}` : `member_id=${targetId}`
    fetch(`/api/project-assignments?${param}&year=${year}`)
      .then(r => r.json())
      .then((data: Assignment[]) => {
        setRows(data.map(a => ({
          _key:       a.id,
          id:         a.id,
          otherId:    mode === 'project' ? a.memberId : a.projectId,
          startMonth: a.startMonth,
          endMonth:   a.endMonth,
          role:       a.role as 'dri' | 'support',
          dirty:      false,
          isNew:      false,
        })))
      })
  }, [open, targetId, mode, year])

  function addRow() {
    setRows(prev => [...prev, {
      _key:       nanoid(),
      otherId:    '',
      startMonth: `${year}-01`,
      endMonth:   `${year}-12`,
      role:       'support',
      dirty:      true,
      isNew:      true,
    }])
  }

  function updateRow(key: string, patch: Partial<DraftRow>) {
    setRows(prev => prev.map(r => r._key === key ? { ...r, ...patch, dirty: true } : r))
  }

  async function deleteRow(row: DraftRow) {
    if (row.id) {
      await fetch(`/api/project-assignments/${row.id}`, { method: 'DELETE' })
    }
    setRows(prev => prev.filter(r => r._key !== row._key))
  }

  async function saveAll() {
    setSaving(true)
    for (const row of rows) {
      if (!row.dirty || !row.otherId || row.startMonth > row.endMonth) continue
      const body = mode === 'project'
        ? { projectId: targetId, memberId: row.otherId, startMonth: row.startMonth, endMonth: row.endMonth, role: row.role }
        : { projectId: row.otherId, memberId: targetId, startMonth: row.startMonth, endMonth: row.endMonth, role: row.role }

      if (row.isNew) {
        const res = await fetch('/api/project-assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const created = await res.json()
        setRows(prev => prev.map(r => r._key === row._key ? { ...r, id: created.id, dirty: false, isNew: false } : r))
      } else if (row.id) {
        await fetch(`/api/project-assignments/${row.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ startMonth: row.startMonth, endMonth: row.endMonth, role: row.role }),
        })
        setRows(prev => prev.map(r => r._key === row._key ? { ...r, dirty: false } : r))
      }
    }
    setSaving(false)
    onRefresh()
  }

  const others      = mode === 'project' ? allMembers : allProjects
  const hasDirty    = rows.some(r => r.dirty && r.otherId)
  const colorDot    = targetColor ?? '#6b7280'

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-[480px] sm:w-[540px] overflow-y-auto p-0">
        <SheetHeader className="px-5 py-4 border-b sticky top-0 bg-white z-10">
          <SheetTitle className="flex items-center gap-2 text-base">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: colorDot }} />
            {targetName}
            <span className="text-xs text-gray-400 font-normal ml-1">
              {mode === 'project' ? '— team assignments' : '— project assignments'}
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="px-5 py-4 space-y-3">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_80px_80px_72px_32px] gap-2 text-xs text-gray-400 font-medium px-1">
            <span>{mode === 'project' ? 'Member' : 'Project'}</span>
            <span>From</span>
            <span>To</span>
            <span>Role</span>
            <span />
          </div>

          {/* Assignment rows */}
          {rows.length === 0 && (
            <p className="text-sm text-gray-400 py-4 text-center">No assignments yet — add one below.</p>
          )}

          {rows.map(row => {
            const otherItem = others.find(o => o.id === row.otherId)
            const dotColor  = mode === 'project' ? '#6b7280' : ((otherItem as Project)?.colorHex ?? '#6b7280')

            return (
              <div
                key={row._key}
                className={`grid grid-cols-[1fr_80px_80px_72px_32px] gap-2 items-center p-2 rounded-lg border transition-colors ${
                  row.dirty ? 'border-amber-200 bg-amber-50/50' : 'border-gray-100 bg-gray-50/50'
                }`}
              >
                {/* Other party selector */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
                  <select
                    value={row.otherId}
                    onChange={e => updateRow(row._key, { otherId: e.target.value })}
                    className="text-xs bg-transparent border-none outline-none w-full truncate cursor-pointer"
                  >
                    <option value="">Select…</option>
                    {others.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>

                {/* Start month */}
                <select
                  value={row.startMonth}
                  onChange={e => {
                    const val = e.target.value
                    updateRow(row._key, {
                      startMonth: val,
                      endMonth: val > row.endMonth ? val : row.endMonth,
                    })
                  }}
                  className="text-xs border rounded px-1.5 py-1 bg-white"
                >
                  {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>

                {/* End month */}
                <select
                  value={row.endMonth}
                  onChange={e => updateRow(row._key, { endMonth: e.target.value })}
                  className="text-xs border rounded px-1.5 py-1 bg-white"
                >
                  {options.filter(o => o.value >= row.startMonth).map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>

                {/* Role toggle */}
                <button
                  onClick={() => updateRow(row._key, { role: row.role === 'dri' ? 'support' : 'dri' })}
                  className={`text-[10px] font-semibold px-2 py-1 rounded-full border transition-colors ${
                    row.role === 'dri'
                      ? 'bg-gray-800 text-white border-gray-800'
                      : 'bg-white text-gray-500 border-gray-300 hover:border-gray-500'
                  }`}
                >
                  {row.role === 'dri' ? '★ DRI' : 'Sup'}
                </button>

                {/* Delete */}
                <button
                  onClick={() => deleteRow(row)}
                  className="text-gray-300 hover:text-red-400 transition-colors flex items-center justify-center"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}

          {/* Add row button */}
          <button
            onClick={addRow}
            className="w-full flex items-center justify-center gap-1.5 py-2 border-2 border-dashed border-gray-200 rounded-lg text-xs text-gray-400 hover:border-gray-300 hover:text-gray-600 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add {mode === 'project' ? 'member' : 'project'}
          </button>
        </div>

        {/* Footer */}
        {hasDirty && (
          <div className="sticky bottom-0 bg-white border-t px-5 py-4">
            <Button className="w-full" onClick={saveAll} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
            <p className="text-xs text-center text-gray-400 mt-1.5">
              Unsaved changes are highlighted in amber
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
