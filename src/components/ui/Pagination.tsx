import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  itemsPerPage?: number
  totalItems?: number
}

export const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  itemsPerPage,
  totalItems
}: PaginationProps) => {
  if (totalPages <= 1) return null

  const renderPageButton = (page: number, isCurrent: boolean) => {
    if (isCurrent) {
      return (
        <button 
          key={page}
          onClick={() => onPageChange(page)}
          className="flex w-10 h-10 items-center justify-center text-navy-900 bg-navy-50 border border-navy-300 rounded-lg font-medium"
        >
          {page}
        </button>
      )
    }

    return (
      <button 
        key={page}
        onClick={() => onPageChange(page)}
        className="flex w-10 h-10 items-center justify-center text-navy-600 hover:text-navy-900 hover:bg-navy-50 border border-transparent rounded-lg hover:border-navy-300"
      >
        {page}
      </button>
    )
  }

  const getPageRange = () => {
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }
    
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Información de elementos */}
      {itemsPerPage !== undefined && totalItems !== undefined && (
        <span className="text-navy-600 text-sm mr-4">
          Mostrando {(currentPage - 1) * itemsPerPage + 1}-{
            Math.min(currentPage * itemsPerPage, totalItems)
          } de {totalItems}
        </span>
      )}
      
      {/* Botón anterior */}
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className={`flex w-10 h-10 items-center justify-center text-navy-600 ${currentPage === 1 ? 
          'opacity-50 cursor-not-allowed' : 
          'hover:text-navy-900 hover:bg-navy-50 border border-transparent rounded-lg hover:border-navy-300'}
        `}
      >
        <ChevronLeft size={16} />
      </button>

      {/* Números de página */}
      <div className="flex space-x-1">
        {getPageRange().map(page => 
          renderPageButton(page, page === currentPage)
        )}
      </div>

      {/* Botón siguiente */}
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className={`flex w-10 h-10 items-center justify-center text-navy-600 ${currentPage === totalPages ? 
          'opacity-50 cursor-not-allowed' : 
          'hover:text-navy-900 hover:bg-navy-50 border border-transparent rounded-lg hover:border-navy-300'}
        `}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}