import { ProjectMatrix } from '@/components/projects/ProjectMatrix'

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Project Loading</h1>
        <p className="text-sm text-gray-500 mt-1">
          Team project assignments across the year — who owns what and when.
        </p>
      </div>
      <ProjectMatrix />
    </div>
  )
}
