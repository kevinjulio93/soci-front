/**
 * Pagination - Componente reutilizable de paginación
 * Principio: Single Responsibility (solo maneja la paginación)
 */

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  maxVisiblePages?: number
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5,
}: PaginationProps) {
  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = []
    
    if (totalPages <= maxVisiblePages) {
      // Si hay pocas páginas, mostrarlas todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Lógica para mostrar páginas con separadores
      const leftSiblingIndex = Math.max(currentPage - 1, 1)
      const rightSiblingIndex = Math.min(currentPage + 1, totalPages)
      
      const shouldShowLeftDots = leftSiblingIndex > 2
      const shouldShowRightDots = rightSiblingIndex < totalPages - 1
      
      // Primera página siempre visible
      pages.push(1)
      
      if (shouldShowLeftDots) {
        pages.push('...')
      }
      
      // Páginas alrededor de la actual
      for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(i)
        }
      }
      
      if (shouldShowRightDots) {
        pages.push('...')
      }
      
      // Última página siempre visible
      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  const handlePageClick = (page: number | string) => {
    if (typeof page === 'number') {
      onPageChange(page)
    }
  }

  return (
    <div className="pagination">
      <button
        className="pagination__btn"
        onClick={handlePrevious}
        disabled={currentPage === 1}
      >
        ←
      </button>
      
      {getPageNumbers().map((page, index) => (
        page === '...' ? (
          <span key={`separator-${index}`} className="pagination__separator">
            ...
          </span>
        ) : (
          <button
            key={page}
            className={`pagination__btn ${
              page === currentPage ? 'pagination__btn--active' : ''
            }`}
            onClick={() => handlePageClick(page)}
          >
            {page}
          </button>
        )
      ))}
      
      <button
        className="pagination__btn"
        onClick={handleNext}
        disabled={currentPage === totalPages}
      >
        →
      </button>
    </div>
  )
}
