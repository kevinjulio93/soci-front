/**
 * Tipos y interfaces centralizadas del proyecto
 * Principio DRY: Single source of truth para tipos
 */

export interface Ability {
  action: string[]
  subject: string
}

export interface Role {
  _id: string
  role: string // 'root', 'admin', 'sociologist'
  permissions: Array<{
    section: string
    actions: string[]
    _id: string
  }>
  status: string
  updatedAt: string
  scope: string
}

export interface User {
  id: string
  email: string
  role: Role
  token: string
  abilities: Ability[]
  status?: 'enabled' | 'disabled'
  profile?: {
    _id: string
    fullName: string
    idNumber: string
    phone?: string
    coordinator?: any
  }
  fullName?: string
  profileType?: 'socializer' | 'coordinator' | 'admin'
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

export interface Survey {
  id: string
  title?: string
  status: 'pending' | 'in_progress' | 'completed'
  participants: number
  date: string
  idType?: string
  identification?: string
  email?: string
  phone?: string
  gender?: string
  ageRange?: string
  city?: string
  neighborhood?: string
  stratum?: number
}

export interface ApiError {
  message: string
  code?: string
  details?: unknown
}

export interface Socializer {
  _id: string
  fullName: string
  idNumber: string
  phone: string
  coordinator?: string | {
    _id: string
    fullName: string
    idNumber: string
    phone: string
    user?: {
      _id: string
      email: string
    }
  }
  location?: {
    lat: number
    long: number
  }
  status: 'enabled' | 'disabled'
  user: {
    _id: string
    email: string
    role: {
      _id: string
      role: string
    } | string
  }
  createdAt: string
  updatedAt: string
}

export interface SocializerFormData {
  fullName: string
  idNumber: string
  phone: string
  email: string
  password: string
  roleId: string
  coordinator?: string
  location?: {
    lat: number
    long: number
  }
  status?: 'enabled' | 'disabled'
}

export interface RoleOption {
  _id: string
  role: string
  originalRole?: string
  status: string
}

// =============================================
// API REQUEST TYPES
// =============================================

export interface CreateRespondentRequest {
  fullName: string
  idType: string
  identification: string
  email?: string
  phone?: string
  address?: string
  gender?: string
  ageRange?: string
  region?: string
  department?: string
  city?: string
  stratum?: string
  neighborhood?: string
}

export interface UpdateRespondentRequest {
  fullName?: string
  idType?: string
  identification?: string
  email?: string
  phone?: string
  address?: string
  gender?: string
  ageRange?: string
  region?: string
  department?: string
  city?: string
  stratum?: string
  neighborhood?: string
}

export interface CreateSocializerRequest {
  fullName: string
  idNumber: string
  phone: string
  email: string
  password: string
  roleId: string
  coordinator?: string
  location?: {
    lat: number
    long: number
  }
  status?: 'enabled' | 'disabled'
}

export interface UpdateSocializerRequest {
  fullName?: string
  idNumber?: string
  phone?: string
  email?: string
  password?: string
  roleId?: string
  coordinator?: string
  location?: {
    lat: number
    long: number
  }
  status?: 'enabled' | 'disabled'
}
