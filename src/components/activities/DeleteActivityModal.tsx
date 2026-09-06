interface DeleteActivityModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  activityTitle: string
  isDeleting: boolean
}

export const DeleteActivityModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  activityTitle, 
  isDeleting 
}: DeleteActivityModalProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-navy-900 mb-2">
          Eliminar actividad
        </h3>
        <p className="text-navy-600 mb-6">
          ¿Estás seguro de que quieres eliminar "<strong>{activityTitle}</strong>"? 
          Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 border border-navy-300 rounded-lg hover:bg-navy-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}
