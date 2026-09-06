import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { resourcesService } from '../../services/resources.service'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../ui/ToastContext'
import type { Resource } from '../../types'

const resourceSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  type: z.enum(['document', 'video', 'link', 'image']),
  linkUrl: z.string().url('URL inválida').optional().or(z.literal('')),
})

type ResourceFormValues = z.infer<typeof resourceSchema>

interface ResourceFormProps {
  resource?: Resource
  onSuccess: () => void
}

export const ResourceForm = ({ resource, onSuccess }: ResourceFormProps) => {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(resource?.file_url || null)
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
  } = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      title: resource?.title || '',
      description: resource?.description || '',
      type: resource?.type || 'document',
      linkUrl: resource?.type === 'link' ? (resource.file_url || '') : '',
    },
  })

  const selectedType = watch('type')
  const isLink = selectedType === 'link'

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      if (selectedType === 'image') {
        const url = URL.createObjectURL(selectedFile)
        setPreviewUrl(url)
      }
    }
  }

  const onSubmit: SubmitHandler<ResourceFormValues> = async (data) => {
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

      if (isLink && !data.linkUrl) {
        throw new Error('Debes ingresar una URL para el tipo enlace.')
      }

      if (!isLink && !file && !resource) {
        throw new Error('Debes seleccionar un archivo para este tipo de recurso.')
      }

      const baseResourceData = {
        title: data.title,
        description: data.description || null,
        type: data.type,
        professor_id: user.id,
        file_url: isLink ? (data.linkUrl || null) : (resource?.file_url || null),
      }

      if (resource) {
        let fileUrl = baseResourceData.file_url
        if (!isLink && file) {
          fileUrl = await resourcesService.uploadResourceFile(file, resource.id, user.id)
        }
        await resourcesService.updateResource(
          resource.id,
          { ...baseResourceData, file_url: fileUrl },
          { userId: user.id, isAdmin }
        )
        success('Recurso actualizado', 'El recurso se ha actualizado correctamente')
      } else {
        const created = await resourcesService.createResource({
          ...baseResourceData,
          file_url: null,
        })

        if (file) {
          const fileUrl = await resourcesService.uploadResourceFile(file, created.id, user.id)
          await resourcesService.updateResource(
            created.id,
            { file_url: fileUrl },
            { userId: user.id, isAdmin }
          )
        }

        success('Recurso creado', 'El recurso se ha creado correctamente')
      }

      onSuccess()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar el recurso'
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

        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1">
            Tipo
          </label>
          <select
            {...register('type')}
            className="w-full px-3 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
          >
            <option value="document">Documento</option>
            <option value="video">Video</option>
            <option value="image">Imagen</option>
            <option value="link">Enlace</option>
          </select>
        </div>

        {isLink ? (
          <div className="md:col-span-2">
            <Input
              label="URL"
              {...register('linkUrl')}
              error={errors.linkUrl?.message}
              placeholder="https://ejemplo.com/recurso"
            />
          </div>
        ) : (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-navy-700 mb-1">
              Archivo
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              accept={
                selectedType === 'document'
                  ? '.pdf,.doc,.docx,.txt'
                  : selectedType === 'image'
                  ? 'image/*'
                  : selectedType === 'video'
                  ? 'video/*'
                  : '*'
              }
              className="w-full px-3 py-2 border border-navy-300 rounded-lg"
            />
            {resource?.file_url && !file && (
              <p className="text-sm text-navy-500 mt-1">
                Archivo actual:{' '}
                <a
                  href={resource.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:underline"
                >
                  Ver archivo
                </a>
              </p>
            )}
            {previewUrl && selectedType === 'image' && (
              <img src={previewUrl} alt="Preview" className="mt-2 h-32 object-cover rounded-lg" />
            )}
          </div>
        )}

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-navy-700 mb-1">
            Descripción
          </label>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full px-3 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Breve descripción del recurso..."
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting}>
          {resource ? 'Actualizar recurso' : 'Crear recurso'}
        </Button>
      </div>
    </form>
  )
}
