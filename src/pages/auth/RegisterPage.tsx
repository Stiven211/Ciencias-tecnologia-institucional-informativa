import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../components/ui/ToastContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { User, Mail, Lock } from 'lucide-react'
import { useInstitutionalUsers } from '../../hooks/useInstitutionalUsers'

const registerSchema = z.object({
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().min(1, 'El email es requerido').email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

export const RegisterPage = () => {
  const navigate = useNavigate()
  const { register: registerUser, loading, error } = useAuth()
  const { success, error: showError } = useToast()
  const { canRegister, loading: checkingLimit } = useInstitutionalUsers()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  if (checkingLimit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-900 to-navy-800 py-12 px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!canRegister) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-900 to-navy-800 py-12 px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-navy-900 mb-4">Registro no disponible</h2>
            <p className="text-navy-600 mb-6">
              Se alcanzó el límite de usuarios institucionales. Contacte al administrador.
            </p>
            <Link to="/login">
              <Button variant="primary">Volver al inicio de sesión</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data.email, data.password, data.fullName)
      success('¡Cuenta creada!', 'Te has registrado correctamente. Bienvenido.')
      navigate('/dashboard')
    } catch (err) {
      showError(
        'Error al registrarse',
        err instanceof Error ? err.message : 'No se pudo crear la cuenta'
      )
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-900 to-navy-800 py-12 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-navy-900">Crear Cuenta</h2>
            <p className="mt-2 text-navy-600">Únete a nuestra comunidad académica</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Nombre completo"
              icon={<User size={18} />}
              placeholder="Juan Pérez García"
              error={errors.fullName?.message}
              {...register('fullName')}
            />

            <Input
              label="Email institucional"
              type="email"
              icon={<Mail size={18} />}
              placeholder="nombre@universidad.edu"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Contraseña"
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

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <div className="text-sm text-navy-500 bg-navy-50 p-3 rounded-lg">
              Al registrarte, se asignará automáticamente el rol de <strong>profesor</strong> y tendrás acceso a crear y gestionar tus propios proyectos.
            </div>

            <Button
              type="submit"
              className="w-full"
              loading={loading}
            >
              {loading ? 'Registrando...' : 'Crear Cuenta'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-navy-600">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-green-600 hover:text-green-700 font-medium">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
