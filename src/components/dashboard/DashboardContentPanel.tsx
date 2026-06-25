import { RecentActivity } from './RecentActivity'
import { UpcomingTasks } from './UpcomingTasks'
import { QuickActions } from './QuickActions'

interface DashboardContentPanelProps {
  recentProjects?: any[]
  recentResources?: any[]
  recentPublications?: any[]
}

export const DashboardContentPanel = ({
  recentProjects = [],
  recentResources = [],
  recentPublications = [],
}: DashboardContentPanelProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <RecentActivity
          recentProjects={recentProjects}
          recentResources={recentResources}
          recentPublications={recentPublications}
        />
        <UpcomingTasks />
      </div>
      <div className="space-y-6">
        <QuickActions />
      </div>
    </div>
  )
}
