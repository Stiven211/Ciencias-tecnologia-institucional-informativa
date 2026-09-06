import { supabase } from '../lib/supabaseClient'
import type { Activity } from '../types'

const requireActivityOwnership = async (
  activityId: string,
  userId: string,
  isAdmin: boolean
): Promise<void> => {
  if (isAdmin) return

  const { data, error } = await supabase
    .from('activities')
    .select('professor_id')
    .eq('id', activityId)
    .single()

  if (error) throw error
  if (!data || data.professor_id !== userId) {
    throw new Error('No tienes permiso para modificar esta actividad.')
  }
}

export const activitiesService = {
  async getActivityById(id: string): Promise<Activity> {
    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        professor:profiles(full_name, avatar_url)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Activity
  },

  async getMyActivities(userId: string): Promise<Activity[]> {
    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        professor:profiles(full_name, avatar_url)
      `)
      .eq('professor_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as Activity[]
  },

  async getAllActivities(): Promise<Activity[]> {
    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        professor:profiles(full_name, avatar_url)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as Activity[]
  },

  async getActivitiesByProfessor(professorId: string): Promise<Activity[]> {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('professor_id', professorId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as Activity[]
  },

  async getUpcomingTasks(limit = 5): Promise<Activity[]> {
    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        professor:profiles(full_name, avatar_url)
      `)
      .gte('due_date', new Date().toISOString().split('T')[0])
      .order('due_date', { ascending: true })
      .limit(limit)

    if (error) throw error
    return (data ?? []) as Activity[]
  },

  async createActivity(
    activity: Omit<Activity, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Activity> {
    const { data, error } = await supabase
      .from('activities')
      .insert([activity])
      .select()
      .single()

    if (error) throw error
    return data as Activity
  },

  async updateActivity(
    id: string,
    activity: Partial<Omit<Activity, 'id' | 'created_at' | 'updated_at'>>,
    context: { userId: string; isAdmin: boolean }
  ): Promise<Activity> {
    await requireActivityOwnership(id, context.userId, context.isAdmin)

    const { data, error } = await supabase
      .from('activities')
      .update(activity)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Activity
  },

  async deleteActivity(
    id: string,
    context: { userId: string; isAdmin: boolean }
  ): Promise<void> {
    await requireActivityOwnership(id, context.userId, context.isAdmin)

    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}