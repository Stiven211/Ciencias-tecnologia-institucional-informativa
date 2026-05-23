import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabaseClient'
import type { Profile } from '../../types'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { Button } from '../ui/Button'
import { AvatarUpload } from '../ui/AvatarUpload'
import { AlertTriangle, CheckCircle } from 'lucide-react'

interface ProfileFormValues {
  full_name: string
  bio: string
  specialization: string
  // social_media: {
  //   twitter?: string
  //   linkedin?: string
  //   website?: string
  // }
}

export const ProfileEditor = () => {
  const { user, profile } = useAuthStore()
  const [values, setValues] = useState<ProfileFormValues>({
    full_name: profile?.full_name || '',
    bio: profile?.bio || '',
    specialization: profile?.specialization || '',
    // social_media: {
    //   twitter: '',
    //   linkedin: '',
    //   website: ''
    // }
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)
      const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null)

  // Inicializar valores cuando cambie el perfil
  // useEffect(() => {
  //   if (profile) {
  //     setValues({
  //       full_name: profile.full_name,
  //       bio: profile.bio,
  //       specialization: profile.specialization,
  //       // social_media: profile.social_media || {
  //       //   twitter: '',
  //       //   linkedin: '',
  //       //   website: ''
  //       // }
  //     })
  //     setAvatarUrl(profile.avatar_url || null)
  //   }
  // }, [profile])

  const handleChange = (field: keyof ProfileFormValues, value: string) => {
    setValues(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAvatarChange = (url: string) => {
    setAvatarUrl(url)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.id) return
    
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)
      
      // Actualizar avatar si se subió uno nuevo
      let finalAvatarUrl = avatarUrl
      
      // Actualizar perfil en la base de datos
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: values.full_name,
          bio: values.bio,
          specialization: values.specialization,
          avatar_url: finalAvatarUrl
          // social_media: values.social_media
        })
        .eq('id', user.id)
      
      if (profileError) throw profileError
      
      // Actualizar el store de autenticación
      useAuthStore.getState().setProfile({
        ...(profile || {}),
        full_name: values.full_name,
        bio: values.bio,
        specialization: values.specialization,
        avatar_url: finalAvatarUrl
        // social_media: values.social_media
      } as Profile)
      
      setSuccess(true)
      
      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccess(false)
      }, 3000)
    } catch (err) {
      console.error('Error updating profile:', err)
      setError(err instanceof Error ? err.message : 'Error al actualizar perfil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center space-x-4">
            <AvatarUpload 
              url={avatarUrl} 
              onChange={handleAvatarChange} 
            />
          <div>
            <h2 className="text-xl font-bold text-navy-900">
              {user?.fullName || 'Perfil del Profesor'}
            </h2>
            <p className="text-navy-600">
              {user?.email || ''}
            </p>
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
          
          {/* 
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-navy-800 mb-2">
              Redes sociales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">
                  Twitter
                </label>
                <Input
                  value={values.social_media.twitter || ''}
                  onChange={(e) => handleChange('social_media', {...values.social_media, twitter: e.target.value})}
                  placeholder="@tuusuario"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">
                  LinkedIn
                </label>
                <Input
                  value={values.social_media.linkedin || ''}
                  onChange={(e) => handleChange('social_media', {...values.social_media, linkedin: e.target.value})}
                  placeholder="linkedin.com/in/tu-perfil"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">
                  Sitio web
                </label>
                <Input
                  value={values.social_media.website || ''}
                  onChange={(e) => handleChange('social_media', {...values.social_media, website: e.target.value})}
                  placeholder="https://tusitio.com"
                />
              </div>
            </div>
          </div>
          */}
        </div>
        
        <div className="flex items-center justify-between">
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </Button>
          
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => {
                // Resetear formulario al estado actual del perfil
                if (profile) {
                  setValues({
                    full_name: profile.full_name || '',
                    bio: profile.bio || '',
                    specialization: profile.specialization || '',
                    // social_media: profile.social_media || {
                    //   twitter: '',
                    //   linkedin: '',
                    //   website: ''
                    // }
                  })
                  setAvatarUrl(profile.avatar_url || null)
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