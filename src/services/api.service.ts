/**
 * Servicio de API - Abstracción de comunicación con backend
 * Principio: Single Responsibility (solo maneja HTTP)
 * Principio: Dependency Inversion (las dependencias apuntan a abstracciones)
 */

import type { LoginCredentials, LoginResponse } from '../types'

const API_BASE_URL = 'https://82f60cf02a72.ngrok-free.app/api/v1'

interface ApiError {
  message: string
  code?: string
  details?: unknown
}

class ApiService {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const token = localStorage.getItem('soci_token')
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (token) {
      headers['x-access-token'] = token
    }

    try {
      const response = await fetch(url, { ...options, headers })

      if (!response.ok) {
        const error: ApiError = {
          message: `HTTP ${response.status}: ${response.statusText}`,
          code: response.status.toString(),
        }
        throw error
      }

      return await response.json()
    } catch (error) {
      if (error instanceof Object && 'message' in error) {
        throw error
      }
      throw {
        message: error instanceof Error ? error.message : 'Error desconocido',
        details: error,
      } as ApiError
    }
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  }

  async logout(): Promise<void> {
    return this.request<void>('/auth/logout', {
      method: 'POST',
    })
  }

  async createRespondent(data: {
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
  }): Promise<{ 
    message: string
    data: {
      _id: string
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
      stratum?: number
      neighborhood?: string
      status: string
      createdAt: string
      updatedAt: string
      __v: number
    }
  }> {
    return this.request('/respondents', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getRespondents(page: number = 1, perPage: number = 10): Promise<{
    currentPage: number
    itemsPerPage: number
    totalItems: number
    totalPages: number
    data: Array<{
      _id: string
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
      stratum?: number
      neighborhood?: string
      status: string
      createdAt: string
      updatedAt: string
    }>
  }> {
    return this.request(`/respondents?page=${page}&perPage=${perPage}`, {
      method: 'GET',
    })
  }

  async getRespondentById(id: string): Promise<{
    data: {
      _id: string
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
      stratum?: number
      neighborhood?: string
      status: string
      createdAt: string
      updatedAt: string
    }
  }> {
    return this.request(`/respondents/${id}`, {
      method: 'GET',
    })
  }

  async updateRespondent(id: string, data: {
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
  }): Promise<{ id: string; message: string }> {
    return this.request(`/respondents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async uploadAudio(respondentId: string, audioBlob: Blob): Promise<{ message: string; audioUrl: string }> {
    const token = localStorage.getItem('soci_token')
    const formData = new FormData()
    formData.append('audio', audioBlob, `recording-${respondentId}-${Date.now()}.webm`)
    formData.append('respondentId', respondentId)
    
    const url = `${this.baseUrl}/respondents/upload-audio`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-access-token': token || '',
      },
      body: formData,
    })

    if (!response.ok) {
      const error: ApiError = {
        message: `HTTP ${response.status}: ${response.statusText}`,
        code: response.status.toString(),
      }
      throw error
    }

    return await response.json()
  }
}

export const apiService = new ApiService()
