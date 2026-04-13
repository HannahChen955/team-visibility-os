'use client'

import { useState } from 'react'
import { MemberManager }   from '@/components/settings/MemberManager'
import { TagManager }      from '@/components/settings/TagManager'
import { LocationManager } from '@/components/settings/LocationManager'

const TABS = [
  { id: 'members',   label: 'Team Members' },
  { id: 'tags',      label: 'Status Tags' },
  { id: 'locations', label: 'Locations' },
]

export default function SettingsPage() {
  const [tab, setTab] = useState('members')
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage team members, tags, and locations</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-xl border p-6">
        {tab === 'members'   && <MemberManager />}
        {tab === 'tags'      && <TagManager />}
        {tab === 'locations' && <LocationManager />}
      </div>
    </div>
  )
}
