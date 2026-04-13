import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Link from 'next/link'
import { QuickFillButton } from '@/components/shared/QuickFillButton'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Team Visibility OS',
  description: 'MO Team Travel & Status Companion',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-gray-50 min-h-screen`}>
        <nav className="bg-white border-b sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <span className="font-semibold text-gray-900">Team Visibility OS</span>
              <div className="flex gap-1">
                <Link href="/"         className="px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">Dashboard</Link>
                <Link href="/timeline" className="px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">Timeline</Link>
                <Link href="/settings" className="px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">Settings</Link>
              </div>
            </div>
            <span className="text-xs text-gray-400">MO Team · {new Date().getFullYear()}</span>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-6 py-6 pb-24">
          {children}
        </main>
        <QuickFillButton />
      </body>
    </html>
  )
}
