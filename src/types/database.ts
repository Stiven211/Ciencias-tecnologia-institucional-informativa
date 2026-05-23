export interface Profile {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'teacher' | 'visitor'
  avatar_url: string | null
  bio: string | null
  specialization: string | null
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  professor_id: string
  title: string
  slug: string
  description: string | null
  content: string | null
  status: 'draft' | 'published' | 'archived'
  cover_image: string | null
  technologies: string[] | null
  gallery_images: string[] | null
  professor?: Profile
  created_at: string
  updated_at: string
}

export type ProjectInsert = Omit<Project, 'id' | 'created_at' | 'updated_at' | 'professor'> & {
  professor_id: string
}

export interface Resource {
  id: string
  professor_id: string
  title: string
  type: 'document' | 'video' | 'link' | 'image'
  file_url: string | null
  description: string | null
  professor?: Profile
  created_at: string
  updated_at: string
}

export type ResourceInsert = Omit<Resource, 'id' | 'created_at' | 'updated_at' | 'professor'> & {
  professor_id: string
}

export interface Publication {
  id: string
  professor_id: string
  title: string
  excerpt: string | null
  content: string | null
  cover_image: string | null
  published: boolean
  published_at: string | null
  professor?: Profile
  created_at: string
  updated_at: string
}

export type PublicationInsert = Omit<Publication, 'id' | 'created_at' | 'updated_at' | 'professor' | 'published_at'>

export interface Activity {
  id: string
  professor_id: string
  title: string
  description: string | null
  due_date: string | null
  professor?: Profile
  created_at: string
  updated_at: string
}

export type ActivityInsert = Omit<Activity, 'id' | 'created_at' | 'updated_at' | 'professor'>