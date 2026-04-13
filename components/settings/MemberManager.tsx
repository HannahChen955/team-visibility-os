'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import type { Member } from '@/lib/types'

const DEFAULT_BASES = ['Shanghai', 'Shenzhen', 'Suzhou']

export function MemberManager() {
  const [members, setMembers] = useState<Member[]>([])
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState<Member | null>(null)
  const [name, setName]       = useState('')
  const [base, setBase]       = useState('Shanghai')
  const [scope, setScope]     = useState('')
  const [saving, setSaving]   = useState(false)

  const refresh = () => fetch('/api/members').then(r => r.json()).then(setMembers)
  useEffect(() => { refresh() }, [])

  function openAdd() { setEditing(null); setName(''); setBase('Shanghai'); setScope(''); setOpen(true) }
  function openEdit(m: Member) { setEditing(m); setName(m.name); setBase(m.baseLocation); setScope(m.scope ?? ''); setOpen(true) }

  async function handleSave() {
    setSaving(true)
    if (editing) {
      await fetch(`/api/members/${editing.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, baseLocation: base, scope }),
      })
    } else {
      await fetch('/api/members', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, baseLocation: base, scope }),
      })
    }
    setSaving(false)
    setOpen(false)
    refresh()
  }

  async function handleDeactivate(id: string) {
    if (!confirm('Deactivate this member? Their history will be preserved.')) return
    await fetch(`/api/members/${id}`, { method: 'DELETE' })
    refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{members.length} active members</p>
        <Button size="sm" onClick={openAdd}><Plus className="w-4 h-4 mr-1" />Add Member</Button>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600">Base</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600">Scope</th>
              <th className="w-20" />
            </tr>
          </thead>
          <tbody>
            {members.map(m => (
              <tr key={m.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-2.5 font-medium">{m.name}</td>
                <td className="px-4 py-2.5 text-gray-500">{m.baseLocation}</td>
                <td className="px-4 py-2.5 text-gray-500 text-xs">{m.scope ?? '—'}</td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(m)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => handleDeactivate(m.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={v => !v && setOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Member' : 'Add Member'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" />
            </div>
            <div className="space-y-1.5">
              <Label>Base Location</Label>
              <Select value={base} onValueChange={v => v && setBase(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEFAULT_BASES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Scope / Role</Label>
              <Input value={scope} onChange={e => setScope(e.target.value)} placeholder="e.g., Supply Chain, Quality…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!name || !base || saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
