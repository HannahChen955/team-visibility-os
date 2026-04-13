'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Tag, Location, Member, StatusEntry } from '@/lib/types'

interface Props {
  open: boolean
  onClose: () => void
  onSave: () => void
  member: Member | null
  prefillDate?: string          // YYYY-MM-DD pre-selected start date
  editEntry?: StatusEntry | null
}

const CATEGORY_LABELS: Record<string, string> = {
  office:    'Office / GTD',
  onsite_cm: 'On-site CM',
  wfh:       'WFH',
  leave:     'Leave',
  holiday:   'Holiday',
  vn:        'VN (Overseas CM)',
}

export function StatusEditModal({ open, onClose, onSave, member, prefillDate, editEntry }: Props) {
  const [tags, setTags]         = useState<Tag[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [tagId, setTagId]       = useState('')
  const [locationId, setLocationId] = useState('')
  const [startDate, setStartDate] = useState(prefillDate ?? '')
  const [endDate, setEndDate]   = useState(prefillDate ?? '')
  const [notes, setNotes]       = useState('')
  const [saving, setSaving]     = useState(false)
  const [overlap, setOverlap]   = useState(false)

  useEffect(() => {
    fetch('/api/tags').then(r => r.json()).then(setTags)
    fetch('/api/locations').then(r => r.json()).then(setLocations)
  }, [])

  // Pre-fill when editing
  useEffect(() => {
    if (editEntry) {
      setTagId(editEntry.tagId)
      setLocationId(editEntry.locationId ?? '')
      setStartDate(editEntry.startDate)
      setEndDate(editEntry.endDate)
      setNotes(editEntry.notes ?? '')
    } else {
      setTagId('')
      setLocationId('')
      setStartDate(prefillDate ?? '')
      setEndDate(prefillDate ?? '')
      setNotes('')
    }
  }, [editEntry, prefillDate, open])

  const selectedTag = tags.find(t => t.id === tagId)
  const needsLocation = selectedTag
    ? ['office', 'onsite_cm', 'vn'].includes(selectedTag.category)
    : false

  // Filter locations based on tag category
  const filteredLocations = (() => {
    if (!selectedTag) return locations
    if (selectedTag.category === 'office') return locations.filter(l => l.type === 'office')
    if (selectedTag.category === 'onsite_cm') return locations.filter(l => l.type === 'cm_site')
    if (selectedTag.category === 'vn') return locations.filter(l => l.type === 'overseas' || l.type === 'cm_site')
    return locations
  })()

  // Group tags by category
  const tagsByCategory = tags.reduce<Record<string, Tag[]>>((acc, t) => {
    if (!acc[t.category]) acc[t.category] = []
    acc[t.category].push(t)
    return acc
  }, {})

  async function handleSave() {
    if (!member || !tagId || !startDate || !endDate) return
    setSaving(true)

    const payload = { memberId: member.id, tagId, locationId: locationId || null, startDate, endDate, notes: notes || null }

    if (editEntry) {
      await fetch(`/api/status/${editEntry.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
    } else {
      await fetch('/api/status', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
    }

    setSaving(false)
    onSave()
    onClose()
  }

  async function handleDelete() {
    if (!editEntry) return
    await fetch(`/api/status/${editEntry.id}`, { method: 'DELETE' })
    onSave()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editEntry ? 'Edit Status' : 'Add Status'}{member ? ` — ${member.name}` : ''}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Tag */}
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={tagId} onValueChange={v => { if (v) { setTagId(v); setLocationId('') } }}>
              <SelectTrigger>
                <SelectValue placeholder="Select status…" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(tagsByCategory).map(([cat, catTags]) => (
                  <div key={cat}>
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {CATEGORY_LABELS[cat] ?? cat}
                    </div>
                    {catTags.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        <span className="flex items-center gap-2">
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: t.colorHex }}
                          />
                          {t.name}
                        </span>
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location (conditional) */}
          {needsLocation && (
            <div className="space-y-1.5">
              <Label>Location {needsLocation ? '*' : ''}</Label>
              <Select value={locationId} onValueChange={v => v && setLocationId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location…" />
                </SelectTrigger>
                <SelectContent>
                  {filteredLocations.map(l => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>End Date</Label>
              <Input type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g., GTK quarterly review" />
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {editEntry && (
              <Button variant="destructive" size="sm" onClick={handleDelete}>Delete</Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !tagId || !startDate || !endDate || (needsLocation && !locationId)}
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
