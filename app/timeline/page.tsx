import { GanttChart } from '@/components/timeline/GanttChart'

export default function TimelinePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team Timeline</h1>
        <p className="text-sm text-gray-500 mt-1">Schedule view · click any cell to update</p>
      </div>
      <GanttChart />
    </div>
  )
}
