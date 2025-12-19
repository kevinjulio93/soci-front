/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Servicio de API - Abstracción de comunicación con backend
 * Principio: Single Responsibility (solo maneja HTTP)
 * Principio: Dependency Inversion (las dependencias apuntan a abstracciones)
 */

import type {
  LoginCredentials,
  LoginResponse,
  CreateRespondentRequest,
  UpdateRespondentRequest,
  CreateSocializerRequest,
  UpdateSocializerRequest,
  User,
} from '../types'
import {
  CreateRespondentResponse,
  GetRespondentsResponse,
  GetRespondentResponse,
  UpdateRespondentResponse,
  UploadAudioResponse,
  GetSocializersResponse,
  GetSocializerResponse,
  CreateSocializerResponse,
  UpdateSocializerResponse,
  DeleteSocializerResponse,
  GetRolesResponse,
  RespondentData,
  SocializerData,
  RoleData,
} from '../models/ApiResponses'
import { EXTERNAL_URLS, API_ENDPOINTS, FILE_CONFIG, MESSAGES } from '../constants'

const API_BASE_URL = EXTERNAL_URLS.API_BASE_URL

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
        // Intentar obtener el mensaje de error del backend
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          if (errorData.message) {
            errorMessage = errorData.message
          }
        } catch {
          // Si no se puede parsear el JSON, usar el mensaje por defecto
        }

        const error: ApiError = {
          message: errorMessage,
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
    return this.request<LoginResponse>(API_ENDPOINTS.AUTH_LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  }

  async getUserProfile(): Promise<{ user: User }> {
    return this.request<{ user: User }>(API_ENDPOINTS.USER_PROFILE, {
      method: 'GET',
    })
  }

  async logout(): Promise<void> {
    return this.request<void>(API_ENDPOINTS.AUTH_LOGOUT, {
      method: 'POST',
    })
  }

  async createRespondent(data: CreateRespondentRequest): Promise<CreateRespondentResponse> {
    const response = await this.request<{ message: string; data: any }>(API_ENDPOINTS.RESPONDENTS, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    
    return new CreateRespondentResponse(response.message, new RespondentData(response.data))
  }

  async getRespondents(page: number = 1, perPage: number = 10): Promise<GetRespondentsResponse> {
    const response = await this.request<any>(`${API_ENDPOINTS.RESPONDENTS}?page=${page}&perPage=${perPage}`, {
      method: 'GET',
    })
    
    const respondents = response.data.map((item: any) => new RespondentData(item))
    
    return new GetRespondentsResponse(
      response.currentPage,
      response.itemsPerPage,
      response.totalItems,
      response.totalPages,
      respondents
    )
  }

  async getRespondentById(id: string): Promise<GetRespondentResponse> {
    const response = await this.request<any>(API_ENDPOINTS.RESPONDENT_BY_ID(id), {
      method: 'GET',
    })
    
    return new GetRespondentResponse(new RespondentData(response.data))
  }

  async updateRespondent(id: string, data: UpdateRespondentRequest): Promise<UpdateRespondentResponse> {
    const response = await this.request<any>(API_ENDPOINTS.RESPONDENT_BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    
    return new UpdateRespondentResponse(response.message, new RespondentData(response.data))
  }

  async deleteRespondent(id: string): Promise<{ success: boolean; message: string }> {
    const response = await this.request<any>(API_ENDPOINTS.RESPONDENT_BY_ID(id), {
      method: 'DELETE',
    })
    
    return {
      success: response.success ?? true,
      message: response.message ?? 'Encuestado eliminado correctamente',
    }
  }

  async getRespondentStats(): Promise<{ totalSurveys: number }> {
    const response = await this.request<any>(API_ENDPOINTS.RESPONDENTS_STATS_TOTAL, {
      method: 'GET',
    })
    
    return {
      totalSurveys: response.data?.total || 0,
    }
  }

  async getTopSocializers(limit: number = 10): Promise<Array<{
    socializerId: string;
    fullName: string;
    idNumber: string;
    userId: string;
    email: string;
    totalSurveys: number;
    enabledSurveys: number;
    disabledSurveys: number;
  }>> {
    const response = await this.request<any>(API_ENDPOINTS.RESPONDENTS_STATS_TOP_SOCIALIZERS(limit), {
      method: 'GET',
    })
    
    return response.data || []
  }

  async uploadAudio(respondentId: string, audioBlob: Blob): Promise<UploadAudioResponse> {
    // Validar que el blob tenga contenido
    if (!audioBlob || audioBlob.size === 0) {
      throw new Error('El audio está vacío o no se pudo grabar correctamente')
    }
    
    const token = localStorage.getItem('soci_token')
    const formData = new FormData()
    
    // Determinar la extensión del archivo basado en el tipo MIME
    let extension = FILE_CONFIG.AUDIO_EXTENSIONS.MP3
    if (audioBlob.type.includes('webm')) {
      extension = FILE_CONFIG.AUDIO_EXTENSIONS.WEBM
    } else if (audioBlob.type.includes('mp4')) {
      extension = FILE_CONFIG.AUDIO_EXTENSIONS.M4A
    } else if (audioBlob.type.includes('mpeg') || audioBlob.type.includes('mp3')) {
      extension = FILE_CONFIG.AUDIO_EXTENSIONS.MP3
    }
    
    formData.append('audio', audioBlob, `recording-${respondentId}-${Date.now()}.${extension}`)
    formData.append('respondentId', respondentId)
    
    const url = `${this.baseUrl}${API_ENDPOINTS.UPLOAD_AUDIO}`
    
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

    const result = await response.json()
    return new UploadAudioResponse(result.message, { audioUrl: result.audioUrl })
  }

  // =============================================
  // SOCIALIZERS ENDPOINTS
  // =============================================

  async getSocializers(page: number = 1, perPage: number = 10): Promise<GetSocializersResponse> {
    const response = await this.request<any>(`${API_ENDPOINTS.SOCIALIZERS}?page=${page}&perPage=${perPage}`)
    
    const socializers = response.data.map((item: any) => new SocializerData(item))
    
    return new GetSocializersResponse(
      response.currentPage,
      response.itemsPerPage,
      response.totalItems,
      response.totalPages,
      socializers
    )
  }

  async getSocializer(id: string): Promise<GetSocializerResponse> {
    const response = await this.request<any>(API_ENDPOINTS.SOCIALIZER_BY_ID(id))
    
    return new GetSocializerResponse(new SocializerData(response.data))
  }

  async getSocializersWithLocations(): Promise<any> {
    const response = await this.request<any>(API_ENDPOINTS.SOCIALIZERS_WITH_LOCATIONS)
    return response
  }

  async createSocializer(data: CreateSocializerRequest): Promise<CreateSocializerResponse> {
    const response = await this.request<any>(API_ENDPOINTS.SOCIALIZERS, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    
    return new CreateSocializerResponse(response.message, new SocializerData(response.data))
  }

  async updateSocializer(id: string, data: UpdateSocializerRequest): Promise<UpdateSocializerResponse> {
    const response = await this.request<any>(API_ENDPOINTS.SOCIALIZER_BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    
    return new UpdateSocializerResponse(response.message, new SocializerData(response.data))
  }

  async deleteSocializer(id: string): Promise<DeleteSocializerResponse> {
    const response = await this.request<any>(API_ENDPOINTS.SOCIALIZER_BY_ID(id), {
      method: 'DELETE',
    })
    
    return new DeleteSocializerResponse(response.message)
  }

  async getRoles(): Promise<GetRolesResponse> {
    const response = await this.request<any>(API_ENDPOINTS.ROLES)
    
    const roles = response.data.map((item: any) => new RoleData(item))
    
    return new GetRolesResponse(roles)
  }

  async getCoordinators(): Promise<Array<{
    _id: string;
    fullName: string;
    idNumber: string;
    email: string;
  }>> {
    // Obtener todos los socializers (con paginación grande para obtener todos)
    const response = await this.request<any>(`${API_ENDPOINTS.SOCIALIZERS}?page=1&perPage=1000`, {
      method: 'GET',
    })
    
    // Filtrar solo los que tienen rol de coordinador
    const coordinators = (response.data || [])
      .filter((item: any) => {
        const roleString = typeof item.user?.role === 'string' 
          ? item.user.role 
          : item.user?.role?.role || ''
        return roleString.toLowerCase() === 'coordinador' || roleString.toLowerCase() === 'coordinator'
      })
      .map((item: any) => ({
        _id: item._id,
        fullName: item.fullName,
        idNumber: item.idNumber,
        email: item.user?.email || ''
      }))
    
    return coordinators
  }

  async batchAssignCoordinator(data: {
    coordinatorId: string;
    socializerIds: string[];
    notes?: string;
    replaceExisting?: boolean;
  }): Promise<{ success: boolean; message: string; data?: any }> {
    const response = await this.request<any>(API_ENDPOINTS.COORDINATOR_ASSIGNMENTS_BATCH, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    
    return {
      success: response.success ?? true,
      message: response.message ?? 'Coordinador asignado correctamente',
      data: response.data,
    }
  }

  async batchUnassignCoordinator(data: {
    coordinatorId: string;
    socializerIds: string[];
    deleteRecords?: boolean;
  }): Promise<{ success: boolean; message: string }> {
    const response = await this.request<any>(API_ENDPOINTS.COORDINATOR_ASSIGNMENTS_BATCH_UNASSIGN, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    
    return {
      success: response.success ?? true,
      message: response.message ?? 'Coordinador desasignado correctamente',
    }
  }

  async updateLocation(data: { userId: string; latitude: number; longitude: number; accuracy: number }): Promise<{ success: boolean; message: string }> {
    const response = await this.request<any>(API_ENDPOINTS.LOCATIONS, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    
    return {
      success: response.success ?? true,
      message: response.message ?? 'Ubicación actualizada correctamente',
    }
  }

  async getLatestLocation(userId: string): Promise<{ lat: number; long: number; timestamp: string; accuracy?: number }> {
    const response = await this.request<any>(API_ENDPOINTS.LOCATION_LATEST(userId), {
      method: 'GET',
    })
    
    // La API devuelve coordinates en formato [longitude, latitude] (GeoJSON format)
    const [longitude, latitude] = response.data.location.coordinates
    
    return {
      lat: latitude,
      long: longitude,
      timestamp: response.data.timestamp,
      accuracy: response.data.accuracy,
    }
  }

  async getReportsBySocializerAndDate(
    startDate: string,
    endDate: string,
    socializerId?: string
  ): Promise<any> {
    let url = `${API_ENDPOINTS.RESPONDENTS_REPORTS_BY_SOCIALIZER_DATE}?startDate=${startDate}&endDate=${endDate}`
    
    if (socializerId) {
      url += `&socializerId=${socializerId}`
    }

    const response = await this.request<any>(url, {
      method: 'GET',
    })
    
    return response
  }
}

export const apiService = new ApiService()
