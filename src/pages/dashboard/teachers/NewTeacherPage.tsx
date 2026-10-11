import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserPlus, ArrowLeft, CheckCircle, AlertTriangle, Info } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { teacherService } from '../../../services/teacher.service'
import { usePermissions } from '../../../hooks/usePermissions'

const schema = z.object({
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().min(1, 'El correo es requerido').email('Correo inválido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Za-z]/, 'Debe incluir al menos una letra')
    .regex(/[0-9]/, 'Debe incluir al menos un número'),
  confirmPassword: z.string(),
  role: z.enum(['teacher', 'admin']),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export const NewTeacherPage = () => {
  const navigate = useNavigate()
  const { isAdmin, canInviteTeachers } = usePermissions()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<{ name: string; email: string } | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'teacher' },
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError(null)
    try {
      const result = await teacherService.inviteTeacher({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        role: data.role,
      })
      setCreated({ name: result.fullName, email: result.email })
      reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar al profesor')
    } finally {
      setLoading(false)
    }
  }

  // El Sidebar oculta el enlace, pero la URL se puede escribir a mano.
  // La Edge Function vuelve a validar esto en el servidor; esto solo evita
  // mostrar un formulario que no va a funcionar.
  if (!canInviteTeachers()) {
    return (
      <Card>
        <div className="text-center py-10">
          <h2 className="text-xl font-semibold text-navy-900 mb-2">Acceso restringido</h2>
          <p className="text-navy-600 mb-6">
            No tienes permiso para registrar profesores. Si crees que es un error,
            contacta al administrador del área.
          </p>
          <Button variant="primary" onClick={() => navigate('/dashboard')}>
            Volver al panel
          </Button>
        </div>
      </Card>
    )
  }

  if (created) {
    return (
      <Card>
        <div className="text-center py-8">
          <CheckCircle size={48} className="mx-auto text-green-600 mb-4" />
          <h2 className="text-xl font-bold text-navy-900 mb-2">Profesor registrado</h2>
          <p className="text-navy-600 mb-6">
            <strong>{created.name}</strong> ya puede iniciar sesión con{' '}
            <strong>{created.email}</strong> y la contraseña que le asignaste.
          </p>
          <p className="text-sm text-navy-500 mb-6">
            Comunícale la contraseña por un canal seguro y pídele que la cambie al
            entrar.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="primary" onClick={() => setCreated(null)}>
              Registrar otro
            </Button>
            <Button variant="secondary" onClick={() => navigate('/dashboard')}>
              Volver al panel
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-1 text-sm text-navy-600 hover:text-navy-900"
        >
          <ArrowLeft size={16} /> Volver al panel
        </button>
        <h1 className="text-2xl font-bold text-navy-900 mt-2 flex items-center gap-2">
          <UserPlus size={24} /> Registrar profesor
        </h1>
        <p className="text-navy-600 mt-1">
          Crea una cuenta de acceso para un docente del área.
        </p>
      </div>

      {!isAdmin() && (
        <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 flex gap-3">
          <Info size={20} className="shrink-0" />
          <p className="text-sm">
            Tienes permiso de invitar, así que las cuentas que crees se registrarán
            siempre como <strong>profesor</strong>. Si necesitas crear una cuenta de
            administrador, pídelo a quien administra el área.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 flex gap-3" role="alert">
          <AlertTriangle size={20} className="shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Nombre completo"
            placeholder="Ana María Rodríguez"
            error={errors.fullName?.message}
            {...register('fullName')}
          />

          <Input
            label="Correo institucional"
            type="email"
            placeholder="nombre@colegio.edu.co"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Contraseña provisional"
            type="text"
            placeholder="Mínimo 8 caracteres, con letras y números"
            error={errors.password?.message}
            {...register('password')}
          />

          <Input
            label="Confirmar contraseña"
            type="text"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          {isAdmin() && (
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-navy-700 mb-1">
                Rol
              </label>
              <select
                id="role"
                {...register('role')}
                className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              >
                <option value="teacher">Profesor</option>
                <option value="admin">Administrador</option>
              </select>
              {errors.role && (
                <p className="text-sm text-red-600 mt-1">{errors.role.message}</p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button type="submit" variant="primary" loading={loading}>
              {loading ? 'Registrando...' : 'Registrar profesor'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/dashboard')}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
