import { InsightPanel } from '@/components/dashboard/InsightPanel'
import { MemberTable }  from '@/components/dashboard/MemberTable'
import { format } from 'date-fns'

export default function DashboardPage() {
  const today = format(new Date(), 'EEEE, MMMM d, yyyy')
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">{today}</p>
      </div>
      <InsightPanel />
      <MemberTable />
    </div>
  )
}
