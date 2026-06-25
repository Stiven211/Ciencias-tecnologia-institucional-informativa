import { useState, useEffect } from 'react'
import { X, Plus } from 'lucide-react'
import { projectsService } from '../../services/projects.service'
import { useToast } from '../ui/ToastContext'
import { STEM_CATEGORIES } from '../../config/stemCategories'

interface GalleryUploadProps {
  images: string[]
  projectId: string
  onChange: (images: string[]) => void
}

export const GalleryUpload = ({ images, projectId, onChange }: GalleryUploadProps) => {
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { success, error: showError } = useToast()

  useEffect(() => {
    const urls = newFiles.map(file => URL.createObjectURL(file))
    setPreviews(urls)
    return () => urls.forEach(url => URL.revokeObjectURL(url))
  }, [newFiles])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setNewFiles(prev => [...prev, ...files])
  }

  const removeNewImage = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index))
  }

  const removeExistingImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index))
  }

  const uploadAll = async () => {
    if (newFiles.length === 0) return

    setUploading(true)
    setError(null)

    try {
      const uploadedUrls: string[] = []
      for (const file of newFiles) {
        const url = await projectsService.uploadGalleryImage(file, projectId)
        uploadedUrls.push(url)
      }
      onChange([...images, ...uploadedUrls])
      setNewFiles([])
      success('Imágenes agregadas', `${uploadedUrls.length} imágenes subidas correctamente`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al subir imágenes'
      setError(message)
      showError('Error', message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-navy-700 mb-1">
        Galería de imágenes
      </label>
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {images.map((url, index) => (
          <div key={index} className="relative group">
            <img src={url} alt={`Gallery ${index}`} className="w-full h-24 object-cover rounded-lg" />
            <button
              type="button"
              onClick={() => removeExistingImage(index)}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        
        {previews.map((url, index) => (
          <div key={`preview-${index}`} className="relative">
            <img src={url} alt={`Preview ${index}`} className="w-full h-24 object-cover rounded-lg opacity-50" />
            <button
              type="button"
              onClick={() => removeNewImage(index)}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        
        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-navy-300 rounded-lg cursor-pointer hover:border-navy-400">
          <Plus size={24} className="text-navy-400" />
          <span className="text-xs text-navy-500 mt-1">Agregar imágenes</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      {newFiles.length > 0 && (
        <button
          type="button"
          onClick={uploadAll}
          disabled={uploading}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
        >
          {uploading ? 'Subiendo...' : `Subir ${newFiles.length} imágenes`}
        </button>
      )}
    </div>
  )
}

interface CategoriesSelectProps {
  selected: string[]
  onChange: (categories: string[]) => void
}

export const CategoriesSelect = ({ selected, onChange }: CategoriesSelectProps) => {
  const toggleCategory = (category: string) => {
    if (selected.includes(category)) {
      onChange(selected.filter(c => c !== category))
    } else {
      onChange([...selected, category])
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-navy-700 mb-1">
        Categorías STEM
      </label>
      <div className="flex flex-wrap gap-2">
        {STEM_CATEGORIES.map(category => (
          <button
            key={category}
            type="button"
            onClick={() => toggleCategory(category)}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              selected.includes(category)
                ? 'bg-green-500 text-white'
                : 'bg-navy-100 text-navy-700 hover:bg-navy-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  )
}