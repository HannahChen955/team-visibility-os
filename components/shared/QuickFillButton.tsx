'use client'

import { useState } from 'react'
import { Zap } from 'lucide-react'
import { QuickFillDrawer } from './QuickFillDrawer'

export function QuickFillButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Floating action button */}
      <button
        onClick={() => setOpen(true)}
        className="
          fixed bottom-6 right-6 z-50
          flex items-center gap-2
          bg-gray-900 hover:bg-gray-700
          text-white
          px-4 py-3 rounded-full
          shadow-lg hover:shadow-xl
          transition-all duration-200
          text-sm font-medium
        "
        title="Quick Fill — plan your week fast"
      >
        <Zap className="w-4 h-4 text-amber-400" />
        Quick Fill
      </button>

      <QuickFillDrawer
        open={open}
        onClose={() => setOpen(false)}
        onSaved={() => {
          // Trigger a full page refresh to reflect saved data
          window.location.reload()
        }}
      />
    </>
  )
}
