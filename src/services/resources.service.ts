import { supabase } from '../lib/supabaseClient'
import type { Resource } from '../types'

export const resourcesService = {
  async getResourcesByProfessor(professorId: string) {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('professor_id', professorId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Resource[]
  },

  async getRecentResources(limit = 5) {
    const { data, error } = await supabase
      .from('resources')
      .select(`
        *,
        professor:profiles(full_name, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as Resource[]
  },

  async createResource(resource: Omit<Resource, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('resources')
      .insert([resource])
      .select()
      .single()

    if (error) throw error
    return data as Resource
  },

  async updateResource(id: string, resource: Partial<Omit<Resource, 'id' | 'created_at' | 'updated_at'>>) {
    const { data, error } = await supabase
      .from('resources')
      .update(resource)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Resource
  },

  async deleteResource(id: string) {
    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}