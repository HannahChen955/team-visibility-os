'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import type { Tag } from '@/lib/types'

const CATEGORIES = [
  { value: 'office',    label: 'Office / GTD' },
  { value: 'onsite_cm', label: 'On-site CM' },
  { value: 'wfh',       label: 'WFH' },
  { value: 'leave',     label: 'Leave' },
  { value: 'holiday',   label: 'Holiday' },
  { value: 'vn',        label: 'VN (Overseas CM)' },
]

export function TagManager() {
  const [tags, setTags]     = useState<Tag[]>([])
  const [open, setOpen]     = useState(false)
  const [editing, setEditing] = useState<Tag | null>(null)
  const [name, setName]     = useState('')
  const [category, setCategory] = useState('office')
  const [saving, setSaving] = useState(false)

  const refresh = () => fetch('/api/tags').then(r => r.json()).then(setTags)
  useEffect(() => { refresh() }, [])

  const tagsByCategory = CATEGORIES.map(cat => ({
    ...cat,
    tags: tags.filter(t => t.category === cat.value),
  }))

  function openAdd() { setEditing(null); setName(''); setCategory('office'); setOpen(true) }
  function openEdit(t: Tag) { setEditing(t); setName(t.name); setCategory(t.category); setOpen(true) }

  async function handleSave() {
    setSaving(true)
    if (editing) {
      await fetch(`/api/tags/${editing.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
    } else {
      await fetch('/api/tags', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category }),
      })
    }
    setSaving(false)
    setOpen(false)
    refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this tag? Any entries using it will lose their tag reference.')) return
    await fetch(`/api/tags/${id}`, { method: 'DELETE' })
    refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button size="sm" onClick={openAdd}><Plus className="w-4 h-4 mr-1" />Add Tag</Button>
      </div>

      {tagsByCategory.map(cat => (
        <div key={cat.value}>
          <h3 className="text-sm font-semibold text-gray-600 mb-2">{cat.label}</h3>
          <div className="flex flex-wrap gap-2">
            {cat.tags.map(t => (
              <div key={t.id} className="flex items-center gap-1 rounded-full border bg-white px-2 py-1">
                <StatusBadge name={t.name} colorHex={t.colorHex} size="sm" />
                <button onClick={() => openEdit(t)} className="text-gray-400 hover:text-gray-600 ml-1">
                  <Pencil className="w-3 h-3" />
                </button>
                {!t.isDefault && (
                  <button onClick={() => handleDelete(t.id)} className="text-red-300 hover:text-red-500">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            {cat.tags.length === 0 && <span className="text-xs text-gray-400">No tags in this category</span>}
          </div>
        </div>
      ))}

      <Dialog open={open} onOpenChange={v => !v && setOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Tag' : 'Add Tag'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Tag Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., GTK, WFH…" />
            </div>
            {!editing && (
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={category} onValueChange={v => v && setCategory(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400">Color is inherited from the category.</p>
              </div>
            )}
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
