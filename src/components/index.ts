/**
 * Barrel export - Centraliza todas las exportaciones de componentes
 * Principio: DRY - Fácil de importar múltiples componentes
 */

export { ProtectedRoute } from './ProtectedRoute'
export { LoginForm } from './LoginForm'
export { DashboardHeader } from './DashboardHeader'
export { SurveyForm } from './SurveyForm'
export { PageHeader } from './PageHeader'
export { Pagination } from './Pagination'
export { SocializerForm } from './SocializerForm'
export { Sidebar } from './Sidebar'
export { LocationModal } from './LocationModal'
export { ConfirmModal } from './ConfirmModal'
export { default as SuccessModal } from './SuccessModal'
export { default as OTPModal } from './OTPModal'
export { DataTable } from './DataTable'
export { SurveyDetailModal } from './SurveyDetailModal'
export { BatchAssignCoordinatorModal } from './BatchAssignCoordinatorModal'
export { Toast } from './Toast'
export { ToastContainer } from './ToastContainer'

// Form Components
export { Input } from './Input'
export { Select } from './Select'
export { SearchableSelect } from './SearchableSelect'
export { DateInput } from './DateInput'
export { Textarea } from './Textarea'
export { FormGroup } from './FormGroup'

// UI Components
export { StatCard } from './StatCard'
export { EmptyState } from './EmptyState'
export { LoadingState } from './LoadingState'
export { MapPopup } from './MapPopup'
export { ReportFilterPanel, INITIAL_FILTERS } from './ReportFilterPanel'
export { ReportTable } from './ReportTable'
export * from './Icons'

export type { TableColumn } from './DataTable'
export type { ToastType, ToastProps } from './Toast'
export type { StatCardProps } from './StatCard'
export type { EmptyStateProps } from './EmptyState'
export type { LoadingStateProps } from './LoadingState'
export type { MapPopupProps, MapPopupField } from './MapPopup'
export type { ReportFilters } from './ReportFilterPanel'
export type { ReportTableColumn } from './ReportTable'
