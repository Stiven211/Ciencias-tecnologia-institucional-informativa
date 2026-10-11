export const TEACHING_AREAS = [
  'Química',
  'Biología',
  'Física',
  'Tecnología e Informática',
  'Educación Ambiental',
  'Robótica',
] as const

export const ACADEMIC_LEVELS = [
  'Normalista',
  'Profesional',
  'Especialización',
  'Maestría',
  'Doctorado',
  'Postdoctorado',
] as const

export type TeachingArea = typeof TEACHING_AREAS[number]
export type AcademicLevel = typeof ACADEMIC_LEVELS[number]
