import { z } from 'zod'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { publicationsService } from '../../services/publications.service'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../ui/ToastContext'
import type { Publication } from '../../types'

const publicationSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  published: z.boolean().default(false),
  published_at: z.string().optional(),
})

type PublicationFormValues = z.infer<typeof publicationSchema>

interface PublicationFormProps {
  publication?: Publication
  onSuccess: () => void
}

export const PublicationForm = ({ publication, onSuccess }: PublicationFormProps) => {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(publication?.cover_image || null)
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
    watch,
    formState: { errors },
  } = useForm<PublicationFormValues>({
    resolver: zodResolver(publicationSchema),
    defaultValues: {
      title: publication?.title || '',
      excerpt: publication?.excerpt || '',
      content: publication?.content || '',
      published: publication?.published || false,
      published_at: publication?.published_at ? new Date(publication.published_at).toISOString().split('T')[0] : '',
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      if (selectedFile.type.startsWith('image/')) {
        const url = URL.createObjectURL(selectedFile)
        setPreviewUrl(url)
      }
    }
  }

  const onSubmit: SubmitHandler<PublicationFormValues> = async (data) => {
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

      const basePublicationData = {
        title: data.title,
        excerpt: data.excerpt || null,
        content: data.content || null,
        published: data.published,
        published_at: data.published_at ? new Date(data.published_at).toISOString() : null,
        professor_id: user.id,
        cover_image: publication?.cover_image || null,
      }

      if (publication) {
        let coverImage = basePublicationData.cover_image
        if (file) {
          coverImage = await publicationsService.uploadPublicationFile(file, publication.id, user.id)
        }
        await publicationsService.updatePublication(
          publication.id,
          { ...basePublicationData, cover_image: coverImage },
          { userId: user.id, isAdmin }
        )
        success('Publicación actualizada', 'La publicación se ha actualizado correctamente')
      } else {
        const created = await publicationsService.createPublication({
          ...basePublicationData,
          cover_image: null,
        })

        if (file) {
          const coverImage = await publicationsService.uploadPublicationFile(file, created.id, user.id)
          await publicationsService.updatePublication(
            created.id,
            { cover_image: coverImage },
            { userId: user.id, isAdmin }
          )
        }

        success('Publicación creada', 'La publicación se ha creado correctamente')
      }

      onSuccess()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar la publicación'
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

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-navy-700 mb-1">
            Extracto
          </label>
          <textarea
            {...register('excerpt')}
            rows={2}
            className="w-full px-3 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Breve resumen de la publicación..."
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-navy-700 mb-1">
            Contenido
          </label>
          <textarea
            {...register('content')}
            rows={6}
            className="w-full px-3 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Contenido completo de la publicación..."
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-navy-700 mb-1">
            Portada
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-navy-300 rounded-lg"
          />
          {publication?.cover_image && !file && (
            <p className="text-sm text-navy-500 mt-1">
              Portada actual:{' '}
              <a
                href={publication.cover_image}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:underline"
              >
                Ver imagen
              </a>
            </p>
          )}
          {previewUrl && (
            <img src={previewUrl} alt="Preview" className="mt-2 h-32 object-cover rounded-lg" />
          )}
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register('published')}
              className="rounded border-navy-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-sm font-medium text-navy-700">Publicado</span>
          </label>
        </div>

        <div>
          <Input
            label="Fecha de publicación"
            type="date"
            {...register('published_at')}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting}>
          {publication ? 'Actualizar publicación' : 'Crear publicación'}
        </Button>
      </div>
    </form>
  )
}
