export const publicNavigation = [
  { name: 'Inicio', href: '/' },
  { name: 'Proyectos', href: '/projects' },
  { name: 'Publicaciones', href: '/publicaciones' },
  { name: 'Acerca de', href: '/about' },
] as const

export type PublicNavigationItem = typeof publicNavigation[number]