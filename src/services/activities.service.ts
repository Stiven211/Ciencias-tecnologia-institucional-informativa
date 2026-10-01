import type { Activity } from '../types'
import { restSelect, restInsert, restUpdate, restDelete, restCount } from '../utils/supabaseRest'

const PROFESSOR_FIELDS = 'full_name,avatar_url'

const requireActivityOwnership = async (
  activityId: string,
  userId: string,
  isAdmin: boolean
): Promise<void> => {
  if (isAdmin) return

  const data = await restSelect<{ professor_id: string }>('activities', 'select=professor_id&id=eq.' + activityId)

  const a = data[0]
  if (!a || a.professor_id !== userId) {
    throw new Error('No tienes permiso para modificar esta actividad.')
  }
}

export const activitiesService = {
  async getActivityById(id: string): Promise<Activity> {
    const data = await restSelect<Activity>(
      'activities',
      'select=*,professor:profiles(' + PROFESSOR_FIELDS + ')&id=eq.' + id + '&limit=1'
    )

    if (!data[0]) throw new Error('Actividad no encontrada')
    return data[0]
  },

  async getMyActivities(userId: string): Promise<Activity[]> {
    return restSelect<Activity>(
      'activities',
      'select=*,professor:profiles(' + PROFESSOR_FIELDS + ')&professor_id=eq.' + userId + '&order=created_at.desc'
    )
  },

  async getAllActivities(): Promise<Activity[]> {
    return restSelect<Activity>(
      'activities',
      'select=*,professor:profiles(' + PROFESSOR_FIELDS + ')&order=created_at.desc'
    )
  },

  async getActivitiesByProfessor(professorId: string): Promise<Activity[]> {
    return restSelect<Activity>(
      'activities',
      'select=*&professor_id=eq.' + professorId + '&order=created_at.desc'
    )
  },

  async getUpcomingTasks(limit = 5): Promise<Activity[]> {
    return restSelect<Activity>(
      'activities',
      'select=*,professor:profiles(' + PROFESSOR_FIELDS + ')&due_date=gte.' +
        new Date().toISOString().split('T')[0] + '&order=due_date.asc&limit=' + limit
    )
  },

  async createActivity(
    activity: Omit<Activity, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Activity> {
    const data = await restInsert<Activity>('activities', [activity])
    return data[0]
  },

  async updateActivity(
    id: string,
    activity: Partial<Omit<Activity, 'id' | 'created_at' | 'updated_at'>>,
    context: { userId: string; isAdmin: boolean }
  ): Promise<Activity> {
    await requireActivityOwnership(id, context.userId, context.isAdmin)

    const data = await restUpdate<Activity>('activities', activity, { id })
    return data[0]
  },

  async deleteActivity(
    id: string,
    context: { userId: string; isAdmin: boolean }
  ): Promise<void> {
    await requireActivityOwnership(id, context.userId, context.isAdmin)
    await restDelete('activities', { id })
  },

  async getActivitiesCountForDashboard(professorId: string): Promise<number> {
    return restCount('activities', { professor_id: 'eq.' + professorId })
  },
}
