'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import type { Location } from '@/lib/types'

const TYPE_LABELS: Record<string, string> = {
  office:   'Office',
  cm_site:  'CM Site',
  overseas: 'Overseas',
}

export function LocationManager() {
  const [locations, setLocations] = useState<Location[]>([])
  const [open, setOpen]           = useState(false)
  const [editing, setEditing]     = useState<Location | null>(null)
  const [name, setName]           = useState('')
  const [type, setType]           = useState('office')
  const [saving, setSaving]       = useState(false)

  const refresh = () => fetch('/api/locations').then(r => r.json()).then(setLocations)
  useEffect(() => { refresh() }, [])

  const grouped = ['office', 'cm_site', 'overseas'].map(t => ({
    type: t, label: TYPE_LABELS[t],
    locs: locations.filter(l => l.type === t),
  }))

  function openAdd() { setEditing(null); setName(''); setType('office'); setOpen(true) }
  function openEdit(l: Location) { setEditing(l); setName(l.name); setType(l.type); setOpen(true) }

  async function handleSave() {
    setSaving(true)
    if (editing) {
      await fetch(`/api/locations/${editing.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type }),
      })
    } else {
      await fetch('/api/locations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type }),
      })
    }
    setSaving(false)
    setOpen(false)
    refresh()
  }

  async function handleDelete(loc: Location) {
    if (loc.isBase) { alert('Base office locations cannot be deleted.'); return }
    if (!confirm('Delete this location?')) return
    await fetch(`/api/locations/${loc.id}`, { method: 'DELETE' })
    refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button size="sm" onClick={openAdd}><Plus className="w-4 h-4 mr-1" />Add Location</Button>
      </div>

      {grouped.map(g => (
        <div key={g.type}>
          <h3 className="text-sm font-semibold text-gray-600 mb-2">{g.label}</h3>
          <div className="rounded-xl border divide-y overflow-hidden">
            {g.locs.map(l => (
              <div key={l.id} className="flex items-center justify-between px-4 py-2.5 bg-white hover:bg-gray-50">
                <span className="text-sm">{l.name} {l.isBase && <span className="text-xs text-gray-400">(base)</span>}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(l)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  {!l.isBase && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => handleDelete(l)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {g.locs.length === 0 && (
              <div className="px-4 py-3 text-xs text-gray-400">No locations in this category</div>
            )}
          </div>
        </div>
      ))}

      <Dialog open={open} onOpenChange={v => !v && setOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Location' : 'Add Location'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Location Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., GTK – Site B" />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={v => v && setType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!name || saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
