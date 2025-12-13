/**
 * Servicio de Storage - Abstracción para persistencia local
 * Principio: Single Responsibility (solo maneja almacenamiento)
 * Beneficio: Fácil de mocear o reemplazar en tests
 */

import type { User } from '../types'

const STORAGE_KEYS = {
  USER: 'soci_user',
  TOKEN: 'soci_token',
} as const

class StorageService {
  getUser(): User | null {
    try {
      const user = localStorage.getItem(STORAGE_KEYS.USER)
      return user ? JSON.parse(user) : null
    } catch {
      return null
    }
  }

  setUser(user: User): void {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
  }

  removeUser(): void {
    localStorage.removeItem(STORAGE_KEYS.USER)
  }

  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.TOKEN)
  }

  setToken(token: string): void {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token)
  }

  removeToken(): void {
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEYS.USER)
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
  }
}

export const storageService = new StorageService()
