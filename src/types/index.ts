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
  title: string
  status: 'pending' | 'in_progress' | 'completed'
  participants: number
  date: string
}

export interface ApiError {
  message: string
  code?: string
  details?: unknown
}
