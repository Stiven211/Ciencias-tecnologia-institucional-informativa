import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { Button } from '../ui/Button'
import { AvatarUpload } from '../ui/AvatarUpload'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { profileService } from '../../services/profile.service'

interface ProfileFormValues {
  full_name: string
  bio: string
  specialization: string
}

export const ProfileEditor = () => {
  const { user, profile } = useAuthStore()
  const [values, setValues] = useState<ProfileFormValues>({
    full_name: profile?.full_name ?? '',
    bio: profile?.bio ?? '',
    specialization: profile?.specialization ?? '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null)

  const handleChange = (field: keyof ProfileFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  const handleAvatarChange = (url: string) => {
    setAvatarUrl(url || null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)
      setSuccess(false)

      const updated = await profileService.updateProfile(user.id, {
        full_name: values.full_name,
        bio: values.bio,
        specialization: values.specialization,
        avatar_url: avatarUrl,
      })

      useAuthStore.getState().setProfile(updated)

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar perfil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center space-x-4">
          <AvatarUpload url={avatarUrl} onChange={handleAvatarChange} />
          <div>
            <h2 className="text-xl font-bold text-navy-900">
              {user?.fullName || 'Perfil del Profesor'}
            </h2>
            <p className="text-navy-600">{user?.email || ''}</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4" role="alert">
            <AlertTriangle size={20} className="mr-3" />
            <div>
              <h3 className="font-bold">Error</h3>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4" role="alert">
            <CheckCircle size={20} className="mr-3" />
            <div>
              <h3 className="font-bold">Éxito</h3>
              <p className="mt-1">Perfil actualizado correctamente</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">
              Nombre completo
            </label>
            <Input
              value={values.full_name}
              onChange={(e) => handleChange('full_name', e.target.value)}
              placeholder="Tu nombre completo"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">
              Biografía
            </label>
            <Textarea
              value={values.bio}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('bio', e.target.value)}
              placeholder="Cuéntanos sobre tu experiencia, intereses y especialidades"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">
              Especialización
            </label>
            <Input
              value={values.specialization}
              onChange={(e) => handleChange('specialization', e.target.value)}
              placeholder="Ej: Física Cuántica, Biología Molecular, etc."
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              if (profile) {
                setValues({
                  full_name: profile.full_name ?? '',
                  bio: profile.bio ?? '',
                  specialization: profile.specialization ?? '',
                })
                setAvatarUrl(profile.avatar_url ?? null)
              }
            }}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  )
}