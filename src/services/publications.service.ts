import { supabase } from '../lib/supabaseClient'
import type { Publication } from '../types'

export const publicationsService = {
  async getPublicationsByProfessor(professorId: string) {
    const { data, error } = await supabase
      .from('publications')
      .select('*')
      .eq('professor_id', professorId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Publication[]
  },

  async getRecentPublications(limit = 5) {
    const { data, error } = await supabase
      .from('publications')
      .select(`
        *,
        professor:profiles(full_name, avatar_url)
      `)
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as Publication[]
  },

  async createPublication(publication: Omit<Publication, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('publications')
      .insert([publication])
      .select()
      .single()

    if (error) throw error
    return data as Publication
  },

  async updatePublication(id: string, publication: Partial<Omit<Publication, 'id' | 'created_at' | 'updated_at'>>) {
    const { data, error } = await supabase
      .from('publications')
      .update(publication)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Publication
  },

  async deletePublication(id: string) {
    const { error } = await supabase
      .from('publications')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}