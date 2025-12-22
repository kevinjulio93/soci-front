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
export { DataTable } from './DataTable'
export { SurveyDetailModal } from './SurveyDetailModal'
export { BatchAssignCoordinatorModal } from './BatchAssignCoordinatorModal'
export { Toast } from './Toast'
export { ToastContainer } from './ToastContainer'

// Form Components
export { Input } from './Input'
export { Select } from './Select'
export { DateInput } from './DateInput'
export { Textarea } from './Textarea'
export { FormGroup } from './FormGroup'

export type { TableColumn } from './DataTable'
export type { ToastType, ToastProps } from './Toast'
