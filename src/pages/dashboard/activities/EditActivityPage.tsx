import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ActivityForm } from '../../../components/activities/ActivityForm'
import { LoadingSpinnerCentered } from '../../../components/ui/LoadingSpinner'
import { activitiesService } from '../../../services/activities.service'
import { useAuthStore } from '../../../store/authStore'
import type { Activity } from '../../../types'

type LoadState =
  | { kind: 'loading' }
  | { kind: 'not-found' }
  | { kind: 'forbidden' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; activity: Activity }

export const EditActivityPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [state, setState] = useState<LoadState>({ kind: 'loading' })

  useEffect(() => {
    if (!id) {
      setState({ kind: 'not-found' })
      return
    }

    let cancelled = false
    activitiesService
      .getActivityById(id)
      .then((activity) => {
        if (cancelled) return
        const isAdmin = user?.role === 'admin'
        const isOwner = user?.id === activity.professor_id
        if (!isAdmin && !isOwner) {
          setState({ kind: 'forbidden' })
          return
        }
        setState({ kind: 'ready', activity })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'No se pudo cargar la actividad.'
        if (/not\s*found|0\s*row/i.test(message) || /not\s*found/i.test(message)) {
          setState({ kind: 'not-found' })
        } else {
          setState({ kind: 'error', message })
        }
      })

    return () => {
      cancelled = true
    }
  }, [id, user?.id, user?.role])

  if (state.kind === 'loading') return <LoadingSpinnerCentered text="Cargando actividad..." />

  if (state.kind === 'not-found') {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <h2 className="text-xl font-semibold text-navy-900 mb-2">Actividad no encontrada</h2>
        <p className="text-navy-600 mb-4">La actividad solicitada no existe o fue eliminada.</p>
        <Link to="/dashboard/activities" className="text-green-600 hover:text-green-700 font-medium">
          Volver a mis actividades
        </Link>
      </div>
    )
  }

  if (state.kind === 'forbidden') {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white border border-red-200 rounded-2xl p-8 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-navy-900 mb-2">Sin permisos</h2>
          <p className="text-navy-600 mb-6">Solo el autor o un administrador puede modificar esta actividad.</p>
          <button
            onClick={() => navigate('/dashboard/activities')}
            className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
          >
            Volver a mis actividades
          </button>
        </div>
      </div>
    )
  }

  if (state.kind === 'error') {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-8">
          <h2 className="text-xl font-semibold mb-2">Error al cargar la actividad</h2>
          <p>{state.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900">Editar actividad</h1>
        <p className="text-navy-600">{state.activity.title}</p>
      </div>

      <ActivityForm activity={state.activity} onSuccess={() => navigate('/dashboard/activities')} />
    </div>
  )
}
