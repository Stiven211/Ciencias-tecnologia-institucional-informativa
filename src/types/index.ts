import type { UserRole, Permission } from '../config/permissions'
import type { TeachingArea, AcademicLevel } from '../config/academicProfile'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url: string | null
  bio: string | null
  specialization: string | null
  teaching_area: TeachingArea | null
  academic_level: AcademicLevel | null
  can_invite_teachers: boolean
  created_at: string
  updated_at: string
}

export interface PublicProfile {
  id: string
  full_name: string
  avatar_url: string | null
  bio: string | null
  specialization: string | null
  teaching_area: TeachingArea | null
  academic_level: AcademicLevel | null
  role: UserRole
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
  gallery_images: string[] | null
  technologies: string[] | null
  categories: string[] | null
  professor?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null
  created_at: string
  updated_at: string
}

export interface ProjectFilters {
  search?: string
  status?: 'draft' | 'published' | 'archived' | 'all'
  technologies?: string[]
  categories?: string[]
  professorId?: string
}

export type ProjectInsert = Pick<Project, 'professor_id' | 'title' | 'slug'> &
  Partial<Omit<Project, 'id' | 'created_at' | 'updated_at' | 'professor' | 'professor_id' | 'title' | 'slug'>>

export interface Resource {
  id: string
  professor_id: string
  title: string
  type: 'document' | 'video' | 'link' | 'image'
  file_url: string | null
  description: string | null
  professor?: Pick<Profile, 'full_name' | 'avatar_url'> | null
  created_at: string
  updated_at: string
}

export type ResourceInsert = Pick<Resource, 'professor_id' | 'title' | 'type'> &
  Partial<Omit<Resource, 'id' | 'created_at' | 'updated_at' | 'professor' | 'professor_id' | 'title' | 'type'>>

export interface Publication {
  id: string
  professor_id: string
  title: string
  excerpt: string | null
  content: string | null
  cover_image: string | null
  published: boolean
  published_at: string | null
  professor?: Pick<Profile, 'full_name' | 'avatar_url'> | null
  created_at: string
  updated_at: string
}

export type PublicationInsert = Pick<Publication, 'professor_id' | 'title'> &
  Partial<Omit<Publication, 'id' | 'created_at' | 'updated_at' | 'professor' | 'published_at' | 'professor_id' | 'title'>>

export interface Activity {
  id: string
  professor_id: string
  title: string
  description: string | null
  due_date: string | null
  professor?: Pick<Profile, 'full_name' | 'avatar_url'> | null
  created_at: string
  updated_at: string
}

export type ActivityInsert = Pick<Activity, 'professor_id' | 'title'> &
  Partial<Omit<Activity, 'id' | 'created_at' | 'updated_at' | 'professor' | 'professor_id' | 'title'>>

export interface User {
  id: string
  email: string
  fullName: string
  role: UserRole
  avatarUrl?: string | null
  permissions?: Permission[]
}

export type { UserRole, Permission }