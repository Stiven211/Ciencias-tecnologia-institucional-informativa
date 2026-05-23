import { z } from 'zod'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { projectsService } from '../../services/projects.service'
import { useAuthStore } from '../../store/authStore'
import type { Project, ProjectInsert } from '../../types'

const projectSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  slug: z.string().min(3, 'El slug debe tener al menos 3 caracteres'),
  description: z.string(),
  content: z.string(),
  status: z.enum(['draft', 'published', 'archived']),
  technologies: z.string(),
})

type ProjectFormValues = z.infer<typeof projectSchema>

interface ProjectFormProps {
  project?: Project
  onSuccess: () => void
}

export const ProjectForm = ({ project, onSuccess }: ProjectFormProps) => {
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState(project?.cover_image || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuthStore()

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
    try {
      setIsSubmitting(true)
      setError(null)

      let coverImageUrl = project?.cover_image || ''

      if (coverImage) {
        coverImageUrl = await projectsService.uploadCoverImage(coverImage, project?.id || 'new')
      }

      const projectData = {
        title: data.title,
        slug: data.slug,
        description: data.description,
        content: data.content,
        status: data.status,
        professor_id: user?.id || '',
        cover_image: coverImageUrl,
        technologies: data.technologies.split(',').map((t) => t.trim()).filter(Boolean),
      }

      if (project) {
        await projectsService.updateProject(project.id, projectData)
      } else {
        await projectsService.createProject(projectData as ProjectInsert & { professor_id: string })
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el proyecto')
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
            className="w-full px-3 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
            label="Tecnologías (separadas por coma)"
            {...register('technologies')}
            placeholder="React, Node.js, Python"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-navy-700 mb-1">
            Descripción
          </label>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full px-3 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Breve descripción del proyecto..."
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-navy-700 mb-1">
            Contenido
          </label>
          <textarea
            {...register('content')}
            rows={8}
            className="w-full px-3 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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