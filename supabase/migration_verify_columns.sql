-- MIGRACION DE VERIFICACION: Asegurar que las columnas existen
-- Ejecutar solo si hay error PGRST204

-- Verificar y agregar columna categories si no existe
ALTER TABLE projects ADD COLUMN IF NOT EXISTS categories TEXT[];

-- Verificar y agregar columna gallery_images si no existe
ALTER TABLE projects ADD COLUMN IF NOT EXISTS gallery_images TEXT[];

-- Agregar constraint para categories si no existe (solo si la columna se agregó o no tiene constraint)
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_categories_check'
  ) THEN
    ALTER TABLE projects ADD CONSTRAINT projects_categories_check 
      CHECK (categories <@ ARRAY['STEM', 'Robótica', 'Programación', 'Videojuegos', 'Ciencias Naturales', 'Tecnología', 'Electrónica', 'IA', 'Matemáticas', 'Física']);
  END IF;
END $$;

-- Verificar índices
CREATE INDEX IF NOT EXISTS idx_projects_categories ON projects USING GIN (categories);
CREATE INDEX IF NOT EXISTS idx_projects_gallery_images ON projects USING GIN (gallery_images);

-- Verificar estructura actual
SELECT 
  column_name, 
  data_type, 
  is_generated, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name IN ('categories', 'gallery_images')
ORDER BY column_name;