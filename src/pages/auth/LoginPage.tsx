import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import React from 'react'
import { AlertCircle } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../components/ui/ToastContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Mail, Lock, } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().min(1, 'El email es requerido').email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

type LoginFormData = z.infer<typeof loginSchema>

/**
 * Supabase responde "Invalid login credentials" a propósito, para no revelar
 * si el correo existe. Para quien lo lee es un mensaje opaco, asi que se
 * traduce. El toast solo se usaba y se desvanecía a los pocos segundos: el
 * error queda tambien en linea, que es donde la gente lo busca.
 */
const friendlyMessage = (raw: string): string => {
  const lower = raw.toLowerCase()
  if (lower.includes('invalid login credentials') || lower.includes('invalid_credentials')) {
    return 'Correo o contraseña incorrectos. Verifica los datos e inténtalo de nuevo.'
  }
  if (lower.includes('email not confirmed')) {
    return 'Tu cuenta aún no está confirmada. Revisa el correo que te enviamos.'
  }
  if (lower.includes('fetch') || lower.includes('network')) {
    return 'No pudimos conectar con el servidor. Revisa tu conexión a internet.'
  }
  return raw
}

export const LoginPage = () => {
  const navigate = useNavigate()
  const { login, loading, error } = useAuth()
  const { success, error: showError } = useToast()
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setSubmitError(null)
    try {
      // El trim no es cosmetico: un espacio pegado al pegar produce un
      // "Invalid login credentials" sin explicacion util.
      await login(data.email.trim(), data.password.trim())
      success('¡Bienvenido!', 'Has iniciado sesión correctamente')
      navigate('/dashboard')
    } catch (err) {
      const message = friendlyMessage(
        err instanceof Error ? err.message : 'Credenciales inválidas'
      )
      setSubmitError(message)
      showError('Error al iniciar sesión', message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-900 to-navy-800 py-12 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-navy-900">Iniciar Sesión</h2>
            <p className="mt-2 text-navy-600">Accede a tu cuenta académica</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Email institucional"
              type="email"
              icon={<Mail size={18} />}
              placeholder="tu@email.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Contraseña"
              type="password"
              icon={<Lock size={18} />}
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password')}
            />

            {(submitError || error) && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
              >
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{submitError || error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              loading={loading}
            >
              {loading ? 'Iniciando...' : 'Iniciar Sesión'}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm">
              <Link to="/forgot-password" className="text-navy-500 hover:text-navy-700">
                ¿Olvidaste tu contraseña?
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
