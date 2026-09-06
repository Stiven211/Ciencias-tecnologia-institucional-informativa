import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { projectsService } from '../../services/projects.service'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../ui/ToastContext'
import { GalleryUpload, CategoriesSelect } from './GalleryUpload'
import type { Project, ProjectInsert } from '../../types'

const projectSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  slug: z.string().min(3, 'El slug debe tener al menos 3 caracteres'),
  description: z.string(),
  content: z.string(),
  status: z.enum(['draft', 'published', 'archived']),
  technologies: z.string(),
  categories: z.array(z.string()).optional(),
})

type ProjectFormValues = z.infer<typeof projectSchema>

interface ProjectFormProps {
  project?: Project
  onSuccess: () => void
}

export const ProjectForm = ({ project, onSuccess }: ProjectFormProps) => {
  const navigate = useNavigate()
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(project?.cover_image || null)
  const [galleryImages, setGalleryImages] = useState<string[]>(project?.gallery_images || [])
  const [galleryFiles, setGalleryFiles] = useState<File[]>([])
  const [categories, setCategories] = useState<string[]>(project?.categories || [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuthStore()
  const { success, error: showError } = useToast()

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: project?.title || '',
      slug: project?.slug || '',
      description: project?.description || '',
      content: project?.content || '',
      status: project?.status || 'draft',
      technologies: project?.technologies?.join(', ') || '',
      categories: project?.categories || [],
    },
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverImage(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const onSubmit: SubmitHandler<ProjectFormValues> = async (data) => {
    if (!user?.id) {
      const errorMsg = 'Usuario no autenticado. Por favor, inicia sesión.'
      setError(errorMsg)
      showError('Error de autenticación', errorMsg)
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const isAdmin = user.role === 'admin'

      const baseProjectData = {
        title: data.title,
        slug: data.slug,
        description: data.description,
        content: data.content,
        status: data.status,
        professor_id: user.id,
        cover_image: null as string | null,
        technologies: data.technologies.split(',').map((t) => t.trim()).filter(Boolean),
        categories: categories,
        gallery_images: [] as string[],
      }

      let savedProject: Project

      if (project) {
        savedProject = await projectsService.updateProject(
          project.id,
          { ...baseProjectData, cover_image: project.cover_image, gallery_images: galleryImages },
          { userId: user.id, isAdmin }
        )
        success('Proyecto actualizado', 'El proyecto se ha actualizado correctamente')
      } else {
        savedProject = await projectsService.createProject(baseProjectData as ProjectInsert & { professor_id: string })
        success('Proyecto creado', 'El proyecto se ha creado correctamente')
      }

      if (coverImage) {
        try {
          const coverImageUrl = await projectsService.uploadCoverImage(coverImage, savedProject.id, user.id)
          await projectsService.updateProject(
            savedProject.id,
            { cover_image: coverImageUrl },
            { userId: user.id, isAdmin }
          )
        } catch (uploadErr) {
          const uploadMsg = uploadErr instanceof Error ? uploadErr.message : 'No se pudo subir la imagen'
          const fallbackMsg = 'El proyecto se creó pero la portada no se subió. Puedes editarlo y volver a subirla.'
          setError(fallbackMsg)
          showError('Error al subir imagen', uploadMsg)
          if (!project) {
            navigate(`/dashboard/projects/${savedProject.id}/edit`)
            return
          }
          return
        }
      }

      if (galleryFiles.length > 0) {
        try {
          const uploadedGalleryUrls: string[] = []
          for (const file of galleryFiles) {
            const url = await projectsService.uploadGalleryImage(file, savedProject.id, user.id)
            uploadedGalleryUrls.push(url)
          }
          const nextGallery = [...galleryImages, ...uploadedGalleryUrls]
          await projectsService.updateProject(
            savedProject.id,
            { gallery_images: nextGallery },
            { userId: user.id, isAdmin }
          )
          setGalleryImages(nextGallery)
          setGalleryFiles([])
        } catch (galleryErr) {
          const galleryMsg = galleryErr instanceof Error ? galleryErr.message : 'No se pudieron subir las imágenes de galería.'
          const fallbackGalleryMsg = project
            ? 'El proyecto se actualizó pero la galería no se subió. Puedes editar y volver a intentarlo.'
            : 'El proyecto se creó pero la galería no se subió. Puedes editarlo y volver a subirla.'
          setError(fallbackGalleryMsg)
          showError('Error al subir galería', galleryMsg)
          if (!project) {
            navigate(`/dashboard/projects/${savedProject.id}/edit`)
            return
          }
          return
        }
      }

      onSuccess()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar el proyecto'
      setError(errorMessage)
      showError('Error', errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Input
            label="Título"
            {...register('title')}
            error={errors.title?.message}
          />
        </div>

        <Input
          label="Slug (URL amigable)"
          {...register('slug')}
          error={errors.slug?.message}
          helperText="ej: mi-proyecto-investigacion"
        />

        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1">
            Estado
          </label>
          <select
            {...register('status')}
            className="w-full px-3 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <option value="draft">Borrador</option>
            <option value="published">Publicado</option>
            <option value="archived">Archivado</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1">
            Imagen de portada
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full px-3 py-2 border border-navy-300 rounded-lg"
          />
          {previewUrl && (
            <img src={previewUrl} alt="Preview" className="mt-2 h-32 object-cover rounded-lg" />
          )}
        </div>

        <div>
          <Input
            label="Palabras clave del proyecto"
            {...register('technologies')}
            placeholder="Biología, Física, Química, etc."
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-navy-700 mb-1">
            Descripción
          </label>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full px-3 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            placeholder="Breve descripción del proyecto..."
          />
        </div>

        <div className="md:col-span-2">
          <CategoriesSelect selected={categories} onChange={setCategories} />
        </div>

        <div className="md:col-span-2">
        {user && (
          <GalleryUpload
            images={galleryImages}
            projectId={project?.id || 'new'}
            files={galleryFiles}
            onFilesChange={setGalleryFiles}
            onImagesChange={setGalleryImages}
          />
        )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-navy-700 mb-1">
            Contenido
          </label>
          <textarea
            {...register('content')}
            rows={8}
            className="w-full px-3 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            placeholder="Contenido detallado del proyecto..."
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting}>
          {project ? 'Actualizar proyecto' : 'Crear proyecto'}
        </Button>
      </div>
    </form>
  )
}
