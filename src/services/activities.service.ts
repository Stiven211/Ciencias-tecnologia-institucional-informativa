import { supabase } from '../lib/supabaseClient'
import type { Activity } from '../types'

export const activitiesService = {
  async getActivitiesByProfessor(professorId: string) {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('professor_id', professorId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Activity[]
  },

  async getUpcomingTasks(limit = 5) {
    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        professor:profiles(full_name, avatar_url)
      `)
      .gte('due_date', new Date().toISOString().split('T')[0]) // Hoy o futuro
      .order('due_date', { ascending: true })
      .limit(limit)

    if (error) throw error
    return data as Activity[]
  },

  async createActivity(activity: Omit<Activity, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('activities')
      .insert([activity])
      .select()
      .single()

    if (error) throw error
    return data as Activity
  },

  async updateActivity(id: string, activity: Partial<Omit<Activity, 'id' | 'created_at' | 'updated_at'>>) {
    const { data, error } = await supabase
      .from('activities')
      .update(activity)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Activity
  },

  async deleteActivity(id: string) {
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}