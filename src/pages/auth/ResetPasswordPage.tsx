import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useToast } from '../../components/ui/ToastContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Lock, Mail } from 'lucide-react'
import { authService } from '../../services/auth.service'
import { supabase } from '../../lib/supabaseClient'

const resetPasswordSchema = z.object({
  email: z.string().min(1, 'El email es requerido').email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirma tu contraseña'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

type View = 'loading' | 'invalid' | 'form' | 'success' | 'error'

export const ResetPasswordPage = () => {
  const { success, error: showError } = useToast()
  const [view, setView] = useState<View>('loading')
  const [sessionError, setSessionError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  useEffect(() => {
    let cancelled = false
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (cancelled) return
        if (!session) {
          setView('invalid')
        } else {
          setView('form')
        }
      } catch {
        if (cancelled) return
        setView('invalid')
      }
    }
    checkSession()
    return () => { cancelled = true }
  }, [])

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      await authService.changePassword(data.password)
      success('Contraseña actualizada', 'Tu contraseña se ha cambiado correctamente.')
      setView('success')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo actualizar la contraseña.'
      showError('Error', message)
      setSessionError(message)
      setView('error')
    }
  }

  if (view === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-900 to-navy-800 py-12 px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto" />
            <p className="mt-4 text-navy-600">Verificando enlace...</p>
          </div>
        </div>
      </div>
    )
  }

  if (view === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-900 to-navy-800 py-12 px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-navy-900 mb-4">Enlace inválido o expirado</h2>
            <p className="text-navy-600 mb-6">
              El enlace de recuperación no es válido o ha caducado. Solicita uno nuevo.
            </p>
            <Link to="/forgot-password" className="inline-block px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700">
              Solicitar nuevo enlace
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (view === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-900 to-navy-800 py-12 px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-navy-900 mb-4">Contraseña actualizada</h2>
            <p className="text-navy-600 mb-6">
              Tu contraseña se ha cambiado correctamente. Ya puedes iniciar sesión.
            </p>
            <Link to="/login" className="inline-block px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700">
              Ir a iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-900 to-navy-800 py-12 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-navy-900">Restablecer Contraseña</h2>
            <p className="mt-2 text-navy-600">Ingresa tu nueva contraseña</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Email institucional"
              type="email"
              icon={<Mail size={18} />}
              placeholder="tu@email.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Nueva contraseña"
              type="password"
              icon={<Lock size={18} />}
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

            <Input
              label="Confirmar contraseña"
              type="password"
              icon={<Lock size={18} />}
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            {sessionError && view === 'error' && (
              <p className="text-sm text-red-600">{sessionError}</p>
            )}

            <Button type="submit" className="w-full">
              Actualizar contraseña
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-navy-600">
              ¿Recordaste tu contraseña?{' '}
              <Link to="/login" className="text-green-600 hover:text-green-700 font-medium">
                Volver al inicio de sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}