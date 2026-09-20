export const STEM_CATEGORIES = [
  'STEM',
  'Robótica',
  'Programación',
  'Videojuegos',
  'Ciencias Naturales',
  'Tecnología',
  'Electrónica',
  'IA',
  'Matemáticas',
  'Física',
] as const;

export type StemCategory = typeof STEM_CATEGORIES[number];