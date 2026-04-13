'use client'

import { useEffect, useState } from 'react'
import type { InsightData } from '@/lib/types'

export function InsightPanel() {
  const [data, setData] = useState<InsightData | null>(null)

  useEffect(() => {
    fetch('/api/insights').then(r => r.json()).then(setData)
  }, [])

  if (!data) return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-20 rounded-xl bg-gray-100" />
      ))}
    </div>
  )

  const stats = [
    { label: 'In Office / On-site', value: data.officeCount + data.travelCount, color: '#86efac', emoji: '🏢' },
    { label: 'WFH',                 value: data.wfhCount,                       color: '#d1d5db', emoji: '🏠' },
    { label: 'On Leave',            value: data.leaveCount,                      color: '#fca5a5', emoji: '🌴' },
    { label: 'No Status Logged',    value: data.noEntryCount,                    color: '#e5e7eb', emoji: '❓' },
  ]

  return (
    <div className="space-y-3">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(s => (
          <div
            key={s.label}
            className="rounded-xl border p-4 flex flex-col gap-1"
            style={{ borderColor: s.color, backgroundColor: s.color + '22' }}
          >
            <span className="text-2xl font-bold" style={{ color: darken(s.color) }}>{s.value}</span>
            <span className="text-xs text-muted-foreground">{s.emoji} {s.label}</span>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <div className="space-y-1.5">
          {data.alerts.map((alert, i) => (
            <div
              key={i}
              className={`rounded-lg px-3 py-2 text-sm flex items-start gap-2 ${
                alert.type === 'danger'  ? 'bg-red-50   text-red-700   border border-red-200' :
                alert.type === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                           'bg-blue-50  text-blue-700  border border-blue-200'
              }`}
            >
              {alert.message}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function darken(hex: string) {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - 70)
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - 70)
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - 70)
  return `rgb(${r},${g},${b})`
}
