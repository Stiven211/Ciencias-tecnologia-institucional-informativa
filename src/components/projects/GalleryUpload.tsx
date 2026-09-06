import { useEffect } from 'react'
import { X, Plus } from 'lucide-react'
import { STEM_CATEGORIES } from '../../config/stemCategories'

interface GalleryUploadProps {
  images: string[]
  projectId: string
  files: File[]
  onFilesChange: (files: File[]) => void
  onImagesChange: (images: string[]) => void
}

export const GalleryUpload = ({ images, projectId, files, onFilesChange, onImagesChange }: GalleryUploadProps) => {
  const previews = files.map(file => URL.createObjectURL(file))

  useEffect(() => {
    return () => {
      previews.forEach(url => URL.revokeObjectURL(url))
    }
  }, [previews])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    onFilesChange([...files, ...selected])
  }

  const removeNewImage = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index))
  }

  const removeExistingImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index))
  }

  const isCreating = projectId === 'new'

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-navy-700 mb-1">
        Galería de imágenes
      </label>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {images.map((url, index) => (
          <div key={index} className="relative group">
            <img src={url} alt={`Gallery ${index}`} className="w-full h-24 object-cover rounded-lg" />
            <button
              type="button"
              onClick={() => removeExistingImage(index)}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label={`Eliminar imagen ${index + 1}`}
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
              aria-label={`Eliminar vista previa ${index + 1}`}
            >
              <X size={14} />
            </button>
          </div>
        ))}

        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-navy-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
          <Plus size={24} className="text-navy-400" />
          <span className="text-xs text-navy-500 mt-1">Agregar</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      {isCreating && files.length > 0 && (
        <p className="text-sm text-navy-600">
          Las imágenes se subirán al crear el proyecto.
        </p>
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
        Categorías
      </label>
      <div className="flex flex-wrap gap-2">
        {STEM_CATEGORIES.map(category => (
          <button
            key={category}
            type="button"
            onClick={() => toggleCategory(category)}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              selected.includes(category)
                ? 'bg-blue-500 text-white'
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