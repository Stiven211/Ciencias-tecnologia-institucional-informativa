import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuthStore } from '../../store/authStore'
import { Upload, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '../ui/Button'
import { Avatar } from '../ui/Avatar'

interface AvatarUploadProps {
  url: string | null
  onChange: (url: string) => void
  isUploading?: boolean
}

export const AvatarUpload = ({ 
  url, 
  onChange, 
  isUploading = false 
}: AvatarUploadProps) => {
  const { user } = useAuthStore()
  const [previewUrl, setPreviewUrl] = useState<string | null>(url)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploadingState, setIsUploadingState] = useState(isUploading)

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setUploadError('Por favor seleccione un archivo de imagen válido')
      return
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('El archivo es demasiado grande. Máximo 5MB permitido')
      return
    }

    setUploadError(null)
    setIsUploadingState(true)

    try {
      // Crear una URL temporal para vista previa
      const tempUrl = URL.createObjectURL(file)
      setPreviewUrl(tempUrl)

      // Generar un nombre de archivo único
      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}-avatar-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Subir a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Obtener URL pública
      const { data: publicUrl } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Actualizar el estado con la URL pública
      setPreviewUrl(publicUrl.publicUrl)
      onChange(publicUrl.publicUrl)

      // Limpiar el input
      e.target.value = ''
    } catch (err) {
      console.error('Error uploading avatar:', err)
      setUploadError(err instanceof Error ? err.message : 'Error al subir el avatar')
      setPreviewUrl(url) // Revertir a la URL anterior
    } finally {
      setIsUploadingState(false)
    }
  }

  const handleRemove = () => {
    setPreviewUrl(null)
    onChange('')
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="relative">
        {previewUrl ? (
          <Avatar 
            src={previewUrl} 
            size={96} 
            isEditable={true}
            onRemove={handleRemove}
          />
        ) : (
          <div className="w-24 h-24 flex items-center justify-center bg-navy-100 rounded-full">
            <Upload size={24} className="text-navy-500" />
          </div>
        )}
        
        {isUploadingState && (
          <div className="absolute bottom-0 right-0 w-8 h-8 flex items-center justify-center bg-green-500 text-white rounded-full text-xs">
            <Loader2 size={12} />
          </div>
        )}
        
        {!isUploadingState && previewUrl && (
          <div className="absolute bottom-0 right-0 w-8 h-8 flex items-center justify-center bg-green-500 text-white rounded-full text-xs">
            <CheckCircle size={12} />
          </div>
        )}
        
        {uploadError && (
          <div className="absolute bottom-0 left-0 w-full px-2 pb-2 text-xs text-red-600 bg-red-50 border-t border-red-200">
            {uploadError}
          </div>
        )}
      </div>
      
          <div className="flex-1 space-y-2">
            <label className="block text-sm font-medium text-navy-700">
              Avatar del perfil
            </label>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => document.getElementById('avatar-upload-input')?.click()}
                disabled={isUploadingState}
                variant={isUploadingState ? 'secondary' : 'primary'}
              >
                {isUploadingState ? 'Subiendo...' : 'Cambiar avatar'}
              </Button>
              <input
                type="file"
                id="avatar-upload-input"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />
            </div>
          </div>
    </div>
  )
}