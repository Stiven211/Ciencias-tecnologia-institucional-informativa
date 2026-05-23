import { Image } from 'lucide-react'

interface AvatarProps {
  src: string | null
  size?: number
  isEditable?: boolean
  onRemove?: () => void
}

export const Avatar = ({ 
  src, 
  size = 40, 
  isEditable = false, 
  onRemove 
}: AvatarProps) => {
  if (!src) {
    return (
      <div className={`w-${size} h-${size} flex items-center justify-center bg-navy-100 rounded-full`}>
        <Image size={24} className="text-navy-500" />
      </div>
    )
  }

  return (
    <div className={`relative w-${size} h-${size} ${isEditable ? 'cursor-pointer' : ''}`}>
      <img 
        src={src} 
        alt="Avatar" 
        className={`w-full h-full object-cover rounded-full border-2 border-white ${isEditable ? 'hover:opacity-90 transition-opacity' : ''}`} 
      />
      {isEditable && onRemove && (
        <button 
          onClick={onRemove}
          className="absolute -right-2 -bottom-2 w-6 h-6 flex items-center justify-center bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
        >
          <Image size={12} className="opacity-80" />
        </button>
      )}
    </div>
  )
}