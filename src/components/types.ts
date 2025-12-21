/**
 * Tipos e interfaces para los componentes
 * Separación de tipos para mejor organización
 */

import type { LoginFormData, SocializerFormData } from '../models/FormData'

// LoginForm types
export interface LoginFormProps {
  onSubmit: (data: ReturnType<LoginFormData['toFormData']>) => Promise<void>
  isLoading?: boolean
  error?: string | null
}

// SurveyForm types
export interface SurveyFormData {
  willingToRespond: boolean
  visitAddress: string
  surveyStatus: 'successful' | 'unsuccessful' | ''
  noResponseReason: 'no_interest' | 'no_time' | 'not_home' | 'privacy_concerns' | 'other' | ''
  fullName: string
  idType: 'CC' | 'TI' | 'CE' | 'PA' | 'RC' | 'NIT' | ''
  identification: string
  email: string
  phone: string
  address: string
  gender: 'Masculino' | 'Femenino' | 'Otro' | 'Prefiero no decir' | ''
  ageRange: '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+' | ''
  region: string
  department: string
  city: string
  stratum: '1' | '2' | '3' | '4' | '5' | '6' | ''
  neighborhood: string
  defendorDePatria: boolean
}

export interface SurveyFormProps {
  videoUrl?: string
  onSubmit: (data: SurveyFormData) => Promise<void>
  isLoading?: boolean
  error?: string | null
  initialData?: SurveyFormData | null
  onWillingToRespondChange?: (willing: boolean) => void
}

// SocializerForm types
export interface SocializerFormProps {
  onSubmit: (data: ReturnType<SocializerFormData['toFormData']>) => Promise<void>
  isLoading?: boolean
  error?: string | null
  initialData?: Partial<ReturnType<SocializerFormData['toFormData']>> | null
  isEditMode?: boolean
}

// SocializerTable types
export interface SocializerTableProps {
  socializers: Array<{
    _id: string
    fullName: string
    idNumber: string
    user: {
      email: string
      role: {
        role: string
      }
    }
    status: 'enabled' | 'disabled'
  }>
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

// SurveyTable types
export interface SurveyTableProps {
  respondents: any[]
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

// Pagination types
export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  itemsPerPage?: number
  totalItems?: number
}

// DashboardHeader types
export interface DashboardHeaderProps {
  userName: string
  userRole: string
  onLogout: () => void
}

// PageHeader types
export interface PageHeaderProps {
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

// Sidebar types
export interface SidebarProps {
  userName?: string
  userRole?: string
}
