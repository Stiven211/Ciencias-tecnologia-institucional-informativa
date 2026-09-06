import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { activitiesService } from '../../services/activities.service'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../ui/ToastContext'
import type { Activity } from '../../types'

const activitySchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  due_date: z.string().optional(),
})

type ActivityFormValues = z.infer<typeof activitySchema>

interface ActivityFormProps {
  activity?: Activity
  onSuccess: () => void
}

export const ActivityForm = ({ activity, onSuccess }: ActivityFormProps) => {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuthStore()
  const { success, error: showError } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      title: activity?.title || '',
      description: activity?.description || '',
      due_date: activity?.due_date || '',
    },
  })

  const onSubmit: SubmitHandler<ActivityFormValues> = async (data) => {
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

      const baseActivityData = {
        title: data.title,
        description: data.description || null,
        due_date: data.due_date || null,
        professor_id: user.id,
      }

      if (activity) {
        await activitiesService.updateActivity(
          activity.id,
          baseActivityData,
          { userId: user.id, isAdmin }
        )
        success('Actividad actualizada', 'La actividad se ha actualizado correctamente')
      } else {
        await activitiesService.createActivity(baseActivityData)
        success('Actividad creada', 'La actividad se ha creado correctamente')
      }

      onSuccess()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar la actividad'
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
            Descripción
          </label>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full px-3 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Descripción de la actividad..."
          />
        </div>

        <div>
          <Input
            label="Fecha límite"
            type="date"
            {...register('due_date')}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting}>
          {activity ? 'Actualizar actividad' : 'Crear actividad'}
        </Button>
      </div>
    </form>
  )
}
