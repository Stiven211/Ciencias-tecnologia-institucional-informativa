import { supabase } from '../lib/supabaseClient'
import { projectsService } from './projects.service'
import { resourcesService } from './resources.service'
import { publicationsService } from './publications.service'
import { activitiesService } from './activities.service'
import type { Project, Resource, Publication } from '../types'

export interface DashboardStats {
  projects: number
  resources: number
  collaborators: number
}

export interface DashboardData {
  recentProjects: Project[]
  recentResources: Resource[]
  recentPublications: Publication[]
}

export interface ProfessorStats {
  projects: number
  published: number
  drafts: number
  resources: number
  publications: number
  activities: number
}

export const dashboardService = {
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    const [projectsResult, resourcesResult, collaboratorsResult] = await Promise.allSettled([
      projectsService.getProjectCountsForDashboard(userId).then(r => r.total),
      resourcesService.getResourcesCountForDashboard(userId),
      supabase.from('profiles').select('id', { count: 'exact', head: true })
        .eq('role', 'teacher')
        .neq('id', userId)
        .then(r => r.count ?? 0),
    ])

    return {
      projects: projectsResult.status === 'fulfilled' ? projectsResult.value : 0,
      resources: resourcesResult.status === 'fulfilled' ? resourcesResult.value : 0,
      collaborators: collaboratorsResult.status === 'fulfilled' ? collaboratorsResult.value : 0,
    }
  },

  async getDashboardData(userId: string): Promise<DashboardData> {
    const [recentProjects, recentResources, recentPublications] = await Promise.allSettled([
      projectsService.getRecentProjectsForDashboard(userId, 5),
      resourcesService.getRecentResourcesForDashboard(userId, 5),
      publicationsService.getRecentPublicationsForDashboard(userId, 5),
    ])

    return {
      recentProjects: recentProjects.status === 'fulfilled' ? recentProjects.value : [],
      recentResources: recentResources.status === 'fulfilled' ? recentResources.value : [],
      recentPublications: recentPublications.status === 'fulfilled' ? recentPublications.value : [],
    }
  },

  async getProfessorStats(userId: string): Promise<ProfessorStats> {
    const [projectsCounts, resourcesCount, publicationsCount, activitiesCount] = await Promise.allSettled([
      projectsService.getProjectCountsForDashboard(userId),
      resourcesService.getResourcesCountForDashboard(userId),
      publicationsService.getPublicationsCountForDashboard(userId),
      activitiesService.getActivitiesCountForDashboard(userId),
    ])

    return {
      projects: projectsCounts.status === 'fulfilled' ? projectsCounts.value.total : 0,
      published: projectsCounts.status === 'fulfilled' ? projectsCounts.value.published : 0,
      drafts: projectsCounts.status === 'fulfilled' ? projectsCounts.value.drafts : 0,
      resources: resourcesCount.status === 'fulfilled' ? resourcesCount.value : 0,
      publications: publicationsCount.status === 'fulfilled' ? publicationsCount.value : 0,
      activities: activitiesCount.status === 'fulfilled' ? activitiesCount.value : 0,
    }
  },
}