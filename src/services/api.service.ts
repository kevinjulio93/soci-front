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
import { EXTERNAL_URLS, API_ENDPOINTS, FILE_CONFIG } from '../constants'

const API_BASE_URL = EXTERNAL_URLS.API_BASE_URL

interface ApiError {
  message: string
  code?: string
  details?: unknown
}

type UserListItem = {
  _id: string
  fullName: string
  email: string
}

type UpdateUserPayload = {
  email?: string
  password?: string
  status?: string
  profileData?: {
    fullName?: string
    phone?: string
    idNumber?: string
  }
}

type UserProfileResponse = {
  user: User
  profile?: unknown
  fullName?: string
  profileType?: string
}

type AdminDashboardParams = {
  startDate: string
  endDate: string
  usuariosDependientes: string
}

type TopSocializerStats = {
  socializerId: string
  fullName: string
  idNumber: string
  userId: string
  email: string
  totalSurveys: number
  successfulSurveys: number
  unsuccessfulSurveys: number
}

type Dashboard002Params = {
  page?: number
  perPage?: number
  startDate?: string
  endDate?: string
  q?: string
  surveyStatus?: 'successful' | 'unsuccessful'
  willingToRespond?: boolean
  isPatriaDefender?: boolean
  isVerified?: boolean
  isLinkedHouse?: boolean
  department?: string
  city?: string
  neighborhood?: string
  gender?: string
  ageRange?: string
  stratum?: string
  idType?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

type Dashboard002Survey = {
  _id: string
  willingToRespond: boolean
  surveyStatus: 'successful' | 'unsuccessful'
  recordingAuthorization: boolean
  fullName: string
  idType?: string
  identification?: string
  email?: string
  phone?: string
  address?: string
  ageRange?: string
  region: string
  department: string
  city?: string
  gender?: string
  stratum?: number
  neighborhood?: string
  isPatriaDefender: boolean
  isVerified: boolean
  isLinkedHouse: boolean
  location: {
    type: 'Point'
    coordinates: [number, number]
  }
  autor: {
    _id: string
    email: string
    role: string
  }
  createdAt: string
  updatedAt: string
  audioFileKey?: string
  socializer: {
    _id: string
    fullName: string
    idNumber: string
    phone: string
  }
  rejectionReason?: {
    value: string
    label: string
  }
  noResponseReason?: {
    value: string
    label: string
  }
  visitAddress?: string
}

type Dashboard002Response = {
  message: string
  data: {
    currentPage: number
    itemsPerPage: number
    totalItems: number
    totalPages: number
    filters: Record<string, unknown>
    surveys: Dashboard002Survey[]
  }
}

type Dashboard003Socializador = {
  socializadorId: string
  socializador: string
  intervenciones: number
  exitosas: number
  noExitosas: number
  defensoresDeLaPatria: number
}

type Dashboard003Response = {
  periodo: {
    inicio: string
    fin: string
  }
  filtros: {
    municipio: string | null
  }
  totalSocializadores: number
  resumen: {
    totalIntervenciones: number
    totalExitosas: number
    totalNoExitosas: number
    totalDefensores: number
  }
  socializadores: Dashboard003Socializador[]
  timestamp: string
}

export type ZoneDepartmentItem = {
  _id: string
  departmentId: string
  name: string
  code: string
  mpio: string
}

export type ZoneMunicipalityItem = {
  _id: string
  name: string
  departmentId: string
  code: string
  mpio: string
}

export type ZoneDepartmentEntry = {
  department: ZoneDepartmentItem
  municipalities: ZoneMunicipalityItem[]
}

export type ZoneDepartmentsResponse = {
  zone: {
    name: string
    zoneNumber: number
  }
  departments: ZoneDepartmentEntry[]
}

class ApiService {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async buildError(response: Response): Promise<ApiError> {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`
    try {
      const errorData = await response.json()
      if (errorData?.message) {
        errorMessage = errorData.message
      }
    } catch {
      // Si no se puede parsear el JSON, usar el mensaje por defecto
    }

    return {
      message: errorMessage,
      code: response.status.toString(),
    }
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
        throw await this.buildError(response)
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

  private async requestFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const token = localStorage.getItem('soci_token')

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-access-token': token || '',
      },
      body: formData,
    })

    if (!response.ok) {
      throw await this.buildError(response)
    }

    return await response.json()
  }

  private async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  private async downloadFile(endpoint: string, defaultFilename: string): Promise<void> {
    const url = `${this.baseUrl}${endpoint}`
    const token = localStorage.getItem('soci_token')
    const headers: Record<string, string> = {}
    if (token) {
      headers['x-access-token'] = token
    }

    const response = await fetch(url, { method: 'GET', headers })
    if (!response.ok) {
      throw await this.buildError(response)
    }

    const disposition = response.headers.get('Content-Disposition')
    let filename = defaultFilename
    if (disposition) {
      const match = disposition.match(/filename="?([^"]+)"?/)
      if (match?.[1]) filename = match[1]
    }

    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = filename
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(blobUrl)
  }

  private async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    })
  }

  private async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    })
  }

  private async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    return this.post<LoginResponse>(API_ENDPOINTS.AUTH_LOGIN, credentials)
  }

  async getUserProfile(): Promise<UserProfileResponse> {
    return this.get<UserProfileResponse>(API_ENDPOINTS.USER_PROFILE)
  }

  async logout(): Promise<void> {
    return this.post<void>(API_ENDPOINTS.AUTH_LOGOUT)
  }

  async createRespondent(data: CreateRespondentRequest): Promise<CreateRespondentResponse> {
    const response = await this.post<{ message: string; data: any }>(API_ENDPOINTS.RESPONDENTS, data)

    return new CreateRespondentResponse(response.message, new RespondentData(response.data))
  }

  async getRespondents(page: number = 1, perPage: number = 10): Promise<GetRespondentsResponse> {
    const response = await this.get<any>(`${API_ENDPOINTS.RESPONDENTS}?page=${page}&perPage=${perPage}`)

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
    const response = await this.get<any>(API_ENDPOINTS.RESPONDENT_BY_ID(id))

    return new GetRespondentResponse(new RespondentData(response.data))
  }

  async updateRespondent(id: string, data: UpdateRespondentRequest): Promise<UpdateRespondentResponse> {
    const response = await this.put<any>(API_ENDPOINTS.RESPONDENT_BY_ID(id), data)

    return new UpdateRespondentResponse(response.message, new RespondentData(response.data))
  }

  async deleteRespondent(id: string): Promise<{ success: boolean; message: string }> {
    const response = await this.delete<any>(API_ENDPOINTS.RESPONDENT_BY_ID(id))

    return {
      success: response.success ?? true,
      message: response.message ?? 'Encuestado eliminado correctamente',
    }
  }

  async getRespondentStats(): Promise<{ totalSurveys: number }> {
    const response = await this.get<any>(API_ENDPOINTS.RESPONDENTS_STATS_TOTAL)

    return {
      totalSurveys: response.data?.total || 0,
    }
  }

  async getTopSocializers(limit: number = 10): Promise<TopSocializerStats[]> {
    const response = await this.get<any>(API_ENDPOINTS.RESPONDENTS_STATS_TOP_SOCIALIZERS(limit))

    return response.data || []
  }

  async getAdminDashboardOverview(params: AdminDashboardParams): Promise<any> {
    const { startDate, endDate, usuariosDependientes } = params
    if (!startDate || !endDate) {
      throw new Error('startDate y endDate son requeridos para el dashboard')
    }

    const response = await this.get<any>(
      API_ENDPOINTS.DASHBOARD_ADMIN(startDate, endDate, usuariosDependientes)
    )

    return response?.data ?? response
  }

  async uploadAudio(respondentId: string, audioBlob: Blob): Promise<UploadAudioResponse> {
    // Validar que el blob tenga contenido
    if (!audioBlob || audioBlob.size === 0) {
      throw new Error('El audio está vacío o no se pudo grabar correctamente')
    }
    
    const formData = new FormData()
    
    // Determinar la extensión del archivo basado en el tipo MIME
    let extension: string = FILE_CONFIG.AUDIO_EXTENSIONS.MP3
    if (audioBlob.type.includes('webm')) {
      extension = FILE_CONFIG.AUDIO_EXTENSIONS.WEBM
    } else if (audioBlob.type.includes('mp4')) {
      extension = FILE_CONFIG.AUDIO_EXTENSIONS.M4A
    } else if (audioBlob.type.includes('mpeg') || audioBlob.type.includes('mp3')) {
      extension = FILE_CONFIG.AUDIO_EXTENSIONS.MP3
    }
    
    formData.append('audio', audioBlob, `recording-${respondentId}-${Date.now()}.${extension}`)
    formData.append('respondentId', respondentId)
    
    const result = await this.requestFormData<{ message: string; audioUrl: string }>(API_ENDPOINTS.UPLOAD_AUDIO, formData)
    return new UploadAudioResponse(result.message, { audioUrl: result.audioUrl })
  }

  // =============================================
  // SOCIALIZERS ENDPOINTS
  // =============================================

  async getSocializersWithLocations(): Promise<any> {
    return this.get<any>(API_ENDPOINTS.SOCIALIZERS_WITH_LOCATIONS)
  }

  async getUsersHierarchy(page: number = 1, perPage: number = 10, search?: string): Promise<GetSocializersResponse> {
    let url = `${API_ENDPOINTS.USERS_HIERARCHY}?page=${page}&perPage=${perPage}`
    if (search && search.trim()) {
      url += `&search=${encodeURIComponent(search.trim())}`
    }
    const response = await this.get<any>(url)
    
    // La respuesta tiene estructura: { data: [], pagination: { page, perPage, total, totalPages } }
    const socializers = response.data.map((item: any) => new SocializerData(item))
    
    return new GetSocializersResponse(
      response.pagination.page,
      response.pagination.perPage,
      response.pagination.total,
      response.pagination.totalPages,
      socializers
    )
  }

  async getUser(id: string): Promise<GetSocializerResponse> {
    const response = await this.get<any>(API_ENDPOINTS.USER_BY_ID(id))
    
    return new GetSocializerResponse(new SocializerData(response.data))
  }

  async updateUser(userId: string, data: UpdateUserPayload): Promise<UpdateSocializerResponse> {
    const response = await this.put<any>(API_ENDPOINTS.USER_BY_ID(userId), data)
    
    return new UpdateSocializerResponse(response.message, new SocializerData(response.data))
  }

  async getUsersHierarchyByRole(userId: string, role: string): Promise<UserListItem[]> {
    const response = await this.get<any>(API_ENDPOINTS.USERS_HIERARCHY_BY_ROLE(userId, role))
    return this.mapUserList(response)
  }

  /**
   * Obtiene subordinados de un usuario específico según el rol
   * Por ejemplo: obtener coordinadores de campo bajo un coordinador de zona
   */
  async getSubordinatesByRole(parentUserId: string, role: string): Promise<UserListItem[]> {
    try {
      const response = await this.get<any>(API_ENDPOINTS.USERS_HIERARCHY_BY_ROLE(parentUserId, role))
      return this.mapUserList(response)
    } catch (error) {
      console.error(`Error loading subordinates for role ${role}:`, error)
      return []
    }
  }

  async createSocializer(data: CreateSocializerRequest): Promise<CreateSocializerResponse> {
    // Transformar datos al nuevo formato del endpoint users/create-with-profile
    const requestBody: any = {
      email: data.email,
      password: data.password,
      roleId: data.roleId,
      profileData: {
        fullName: data.fullName,
        idNumber: data.idNumber,
        phone: data.phone
      }
    }

    // Agregar campos jerárquicos según lo que venga en data
    if (data.supervisorId) {
      requestBody.supervisorId = data.supervisorId
    }
    if (data.fieldCoordinatorId) {
      requestBody.fieldCoordinatorId = data.fieldCoordinatorId
    }
    if (data.zoneCoordinatorId) {
      requestBody.zoneCoordinatorId = data.zoneCoordinatorId
    }
    if (data.adminId) {
      requestBody.adminId = data.adminId
    }

    const response = await this.post<any>(API_ENDPOINTS.USERS_CREATE_WITH_PROFILE, requestBody)
    
    // The create endpoint returns { data: { profile: {..., user: {...}}, userId } }
    // Normalize to the structure SocializerData expects (list/hierarchy format)
    const profileData = response.data?.profile || response.data
    return new CreateSocializerResponse(response.message, new SocializerData(profileData))
  }

  async deleteSocializer(id: string): Promise<DeleteSocializerResponse> {
    const response = await this.delete<any>(API_ENDPOINTS.SOCIALIZER_BY_ID(id))
    
    return new DeleteSocializerResponse(response.message)
  }

  async getRoles(): Promise<GetRolesResponse> {
    const response = await this.get<any>(API_ENDPOINTS.ROLES)
    
    const roles = response.data.map((item: any) => new RoleData(item))
    
    return new GetRolesResponse(roles)
  }

  async getCoordinators(): Promise<Array<{
    _id: string
    fullName: string
    idNumber: string
    email: string
  }>> {
    // Obtener todos los socializers (con paginación grande para obtener todos)
    const response = await this.get<any>(`${API_ENDPOINTS.SOCIALIZERS}?page=1&perPage=1000`)
    
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

  private mapUserList(response: any): UserListItem[] {
    const data = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : []
    return data.map((item: any) => ({
      _id: item._id,
      fullName: item.fullName,
      email: item.user?.email || item.email || '',
    }))
  }

  async getZoneCoordinators(): Promise<UserListItem[]> {
    const response = await this.get<any>(API_ENDPOINTS.ZONE_COORDINATORS)
    return this.mapUserList(response)
  }

  async getFieldCoordinators(): Promise<UserListItem[]> {
    const response = await this.get<any>(API_ENDPOINTS.FIELD_COORDINATORS)
    return this.mapUserList(response)
  }

  async getSupervisors(): Promise<UserListItem[]> {
    const response = await this.get<any>(API_ENDPOINTS.SUPERVISORS)
    return this.mapUserList(response)
  }

  async batchAssignCoordinator(data: {
    coordinatorId: string;
    socializerIds: string[];
    notes?: string;
    replaceExisting?: boolean;
  }): Promise<{ success: boolean; message: string; data?: any }> {
    const response = await this.post<any>(API_ENDPOINTS.COORDINATOR_ASSIGNMENTS_BATCH, data)
    
    return {
      success: response.success ?? true,
      message: response.message ?? 'Supervisor asignado correctamente',
      data: response.data,
    }
  }

  async batchUnassignCoordinator(data: {
    coordinatorId: string;
    socializerIds: string[];
    deleteRecords?: boolean;
  }): Promise<{ success: boolean; message: string }> {
    const response = await this.post<any>(API_ENDPOINTS.COORDINATOR_ASSIGNMENTS_BATCH_UNASSIGN, data)
    
    return {
      success: response.success ?? true,
      message: response.message ?? 'Supervisor desasignado correctamente',
    }
  }

  async updateLocation(data: { userId: string; latitude: number; longitude: number; accuracy: number }): Promise<{ success: boolean; message: string }> {
    const response = await this.post<any>(API_ENDPOINTS.LOCATIONS, data)
    
    return {
      success: response.success ?? true,
      message: response.message ?? 'Ubicación actualizada correctamente',
    }
  }

  async getLatestLocation(userId: string): Promise<{ lat: number; long: number; timestamp: string; accuracy?: number }> {
    const response = await this.get<any>(API_ENDPOINTS.LOCATION_LATEST(userId))
    
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

    const response = await this.get<any>(url)
    
    return response
  }

  async getCompleteReport(
    startDate?: string,
    endDate?: string,
    socializerId?: string,
    page: number = 1,
    perPage: number = 10000
  ): Promise<any> {
    const params = new URLSearchParams()
    
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    if (socializerId) params.append('socializerId', socializerId)
    params.append('page', page.toString())
    params.append('perPage', perPage.toString())

    const url = `${API_ENDPOINTS.RESPONDENTS_REPORTS_COMPLETE}?${params.toString()}`

    const response = await this.get<any>(url)
    
    return response
  }

  /**
   * Obtiene datos del dashboard002 con filtros avanzados
   * Nuevo endpoint para reportes con múltiples parámetros de filtrado
   */
  async getDashboard002Report(params: Dashboard002Params): Promise<Dashboard002Response> {
    const queryParams = new URLSearchParams()
    
    // Parámetros de paginación
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.perPage) queryParams.append('perPage', params.perPage.toString())
    
    // Parámetros de fecha
    if (params.startDate) queryParams.append('startDate', params.startDate)
    if (params.endDate) queryParams.append('endDate', params.endDate)
    
    // Parámetros de búsqueda y estado
    if (params.q) queryParams.append('q', params.q)
    if (params.surveyStatus) queryParams.append('surveyStatus', params.surveyStatus)
    if (params.willingToRespond !== undefined) queryParams.append('willingToRespond', params.willingToRespond.toString())
    if (params.isPatriaDefender !== undefined) queryParams.append('isPatriaDefender', params.isPatriaDefender.toString())
    if (params.isVerified !== undefined) queryParams.append('isVerified', params.isVerified.toString())
    if (params.isLinkedHouse !== undefined) queryParams.append('isLinkedHouse', params.isLinkedHouse.toString())
    
    // Parámetros de ubicación
    if (params.department) queryParams.append('department', params.department)
    if (params.city) queryParams.append('city', params.city)
    if (params.neighborhood) queryParams.append('neighborhood', params.neighborhood)
    
    // Parámetros demográficos
    if (params.gender) queryParams.append('gender', params.gender)
    if (params.ageRange) queryParams.append('ageRange', params.ageRange)
    if (params.stratum) queryParams.append('stratum', params.stratum)
    if (params.idType) queryParams.append('idType', params.idType)
    
    // Parámetros de ordenamiento
    if (params.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)
    
    const url = `${API_ENDPOINTS.DASHBOARD_002}?${queryParams.toString()}`
    const response = await this.get<Dashboard002Response>(url)
    
    return response
  }

  /**
   * Obtiene datos del dashboard003 - Resumen por socializador
   */
  async getDashboard003Report(params: {
    fecha_inicio: string
    fecha_fin: string
    municipio?: string
  }): Promise<Dashboard003Response> {
    const queryParams = new URLSearchParams()
    queryParams.append('fecha_inicio', params.fecha_inicio)
    queryParams.append('fecha_fin', params.fecha_fin)
    if (params.municipio?.trim()) {
      queryParams.append('municipio', params.municipio.trim())
    }
    const url = `${API_ENDPOINTS.DASHBOARD_003}?${queryParams.toString()}`
    return this.get<Dashboard003Response>(url)
  }

  /**
   * Exportar Dashboard001 a Excel
   */
  async exportDashboard001(params: {
    fecha_inicio: string
    fecha_fin: string
    usuarios_dependientes?: string
  }): Promise<void> {
    const queryParams = new URLSearchParams()
    queryParams.append('fecha_inicio', params.fecha_inicio)
    queryParams.append('fecha_fin', params.fecha_fin)
    if (params.usuarios_dependientes) {
      queryParams.append('usuarios_dependientes', params.usuarios_dependientes)
    }
    const endpoint = `${API_ENDPOINTS.DASHBOARD_001_EXPORT}?${queryParams.toString()}`
    const filename = `dashboard001_${params.fecha_inicio}_${params.fecha_fin}.xlsx`
    return this.downloadFile(endpoint, filename)
  }

  /**
   * Exportar Dashboard002 a Excel
   */
  async exportDashboard002(params: Dashboard002Params): Promise<void> {
    const queryParams = new URLSearchParams()
    if (params.startDate) queryParams.append('startDate', params.startDate)
    if (params.endDate) queryParams.append('endDate', params.endDate)
    if (params.q) queryParams.append('q', params.q)
    if (params.surveyStatus) queryParams.append('surveyStatus', params.surveyStatus)
    if (params.willingToRespond !== undefined) queryParams.append('willingToRespond', params.willingToRespond.toString())
    if (params.isPatriaDefender !== undefined) queryParams.append('isPatriaDefender', params.isPatriaDefender.toString())
    if (params.isVerified !== undefined) queryParams.append('isVerified', params.isVerified.toString())
    if (params.isLinkedHouse !== undefined) queryParams.append('isLinkedHouse', params.isLinkedHouse.toString())
    if (params.department) queryParams.append('department', params.department)
    if (params.city) queryParams.append('city', params.city)
    if (params.neighborhood) queryParams.append('neighborhood', params.neighborhood)
    if (params.gender) queryParams.append('gender', params.gender)
    if (params.ageRange) queryParams.append('ageRange', params.ageRange)
    if (params.stratum) queryParams.append('stratum', params.stratum)
    if (params.idType) queryParams.append('idType', params.idType)
    if (params.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)
    const endpoint = `${API_ENDPOINTS.DASHBOARD_002_EXPORT}?${queryParams.toString()}`
    const filename = `dashboard002_${params.startDate || ''}_${params.endDate || ''}.xlsx`
    return this.downloadFile(endpoint, filename)
  }

  /**
   * Obtener departamentos y municipios de una zona
   */
  async getZoneDepartments(zoneNumber: number): Promise<ZoneDepartmentsResponse> {
    return this.get<ZoneDepartmentsResponse>(API_ENDPOINTS.ZONES_DEPARTMENTS(zoneNumber))
  }

  /**
   * Obtener todos los departamentos disponibles
   */
  async getDepartments(): Promise<ZoneDepartmentItem[]> {
    const response = await this.get<{ data: ZoneDepartmentItem[] }>(API_ENDPOINTS.DEPARTMENTS)
    return response.data || []
  }

  /**
   * Obtener municipios de un departamento
   */
  async getMunicipalitiesByDepartment(departmentId: string): Promise<ZoneMunicipalityItem[]> {
    const response = await this.get<{ data: ZoneMunicipalityItem[] }>(API_ENDPOINTS.DEPARTMENTS_MUNICIPALITIES(departmentId))
    return response.data || []
  }

  /**
   * Exportar Dashboard003 a Excel
   */
  async exportDashboard003(params: {
    fecha_inicio: string
    fecha_fin: string
    municipio?: string
  }): Promise<void> {
    const queryParams = new URLSearchParams()
    queryParams.append('fecha_inicio', params.fecha_inicio)
    queryParams.append('fecha_fin', params.fecha_fin)
    if (params.municipio?.trim()) {
      queryParams.append('municipio', params.municipio.trim())
    }
    const endpoint = `${API_ENDPOINTS.DASHBOARD_003_EXPORT}?${queryParams.toString()}`
    const muni = params.municipio?.trim() ? `_${params.municipio.trim()}` : ''
    const filename = `dashboard003_${params.fecha_inicio}_${params.fecha_fin}${muni}.xlsx`
    return this.downloadFile(endpoint, filename)
  }
}

export const apiService = new ApiService()
