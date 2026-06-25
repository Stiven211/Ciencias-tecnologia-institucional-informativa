import type { UserRole, Permission } from '../config/permissions'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url?: string
  bio?: string
  specialization?: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  professor_id: string
  title: string
  slug: string
  description?: string
  content?: string
  status?: 'draft' | 'published' | 'archived'
  cover_image?: string
  gallery_images?: string[]
  technologies?: string[]
  categories?: string[]
  professor?: Profile
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

export type ProjectInsert = Omit<Project, 'id' | 'created_at' | 'updated_at' | 'professor'>

export interface Resource {
  id: string
  professor_id: string
  title: string
  type?: 'document' | 'video' | 'link' | 'image'
  file_url?: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Publication {
  id: string
  professor_id: string
  title: string
  excerpt?: string
  content?: string
  cover_image?: string
  published?: boolean
  published_at?: string
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  professor_id: string
  title: string
  description?: string
  due_date?: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  fullName: string
  role: UserRole
  avatarUrl?: string
  permissions?: Permission[]
}

export type { UserRole, Permission }