/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Modelos de respuestas de API
 * Usar clases para crear instancias con métodos helper
 */

// =============================================
// BASE RESPONSE CLASSES
// =============================================

export class ApiResponse<T> {
  readonly message: string
  readonly data: T
  
  constructor(message: string, data: T) {
    this.message = message
    this.data = data
  }
}

export class PaginatedResponse<T> {
  readonly currentPage: number
  readonly itemsPerPage: number
  readonly totalItems: number
  readonly totalPages: number
  readonly data: T[]
  
  constructor(
    currentPage: number,
    itemsPerPage: number,
    totalItems: number,
    totalPages: number,
    data: T[]
  ) {
    this.currentPage = currentPage
    this.itemsPerPage = itemsPerPage
    this.totalItems = totalItems
    this.totalPages = totalPages
    this.data = data
  }

  hasNextPage(): boolean {
    return this.currentPage < this.totalPages
  }

  hasPreviousPage(): boolean {
    return this.currentPage > 1
  }

  isEmpty(): boolean {
    return this.data.length === 0
  }
}

// =============================================
// RESPONDENT RESPONSES
// =============================================

export class RespondentData {
  public _id: string
  public fullName?: string
  public idType?: string
  public identification?: string
  public status: string
  public createdAt: string
  public updatedAt: string
  public email?: string
  public phone?: string
  public address?: string
  public gender?: string
  public ageRange?: string
  public region?: string
  public department?: string
  public city?: string
  public stratum?: number
  public neighborhood?: string
  public latitude?: number
  public longitude?: number
  public location?: {
    type: string
    coordinates: [number, number]
  }
  public audioPath?: string
  public audioUrl?: string | null
  public audioFile?: string
  public audioFileKey?: string
  public autor?: any
  public willingToRespond?: boolean
  public rejectionReason?: string
  public noResponseReason?: string
  public visitAddress?: string
  public surveyStatus?: string
  public isPatriaDefender?: boolean
  public municipality?: string
  public recordingAuthorization?: boolean
  public isLinkedHouse?: boolean
  public isVerified?: boolean
  public facebookUsername?: string

  constructor(data: any) {
    // Helper: extract a plain string from a value that may be a populated DB object
    const extractString = (val: any): string | undefined => {
      if (!val) return undefined
      if (typeof val === 'string') return val
      // Populated municipality/department object → use .name
      if (typeof val === 'object' && val.name) return val.name
      return undefined
    }

    this._id = data._id
    this.fullName = data.fullName
    this.idType = data.idType
    this.identification = data.identification
    this.status = data.status
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    this.email = data.email
    this.phone = data.phone
    this.address = data.address
    this.gender = data.gender
    this.ageRange = data.ageRange
    this.region = data.region
    this.department = extractString(data.department)
    this.city = extractString(data.municipality) || extractString(data.city)
    this.stratum = data.stratum
    this.neighborhood = data.neighborhood
    this.latitude = data.latitude
    this.longitude = data.longitude
    this.location = data.location
    this.audioPath = data.audioPath
    this.audioUrl = data.audioUrl
    this.audioFile = data.audioFile
    this.audioFileKey = data.audioFileKey
    this.autor = data.autor
    this.willingToRespond = data.willingToRespond
    this.rejectionReason = data.rejectionReason
    this.noResponseReason = data.noResponseReason
    this.visitAddress = data.visitAddress
    this.surveyStatus = data.surveyStatus
    this.isPatriaDefender = data.isPatriaDefender
    this.municipality = extractString(data.municipality)
    this.recordingAuthorization = data.recordingAuthorization
    this.isLinkedHouse = data.isLinkedHouse
    this.isVerified = data.isVerified
    this.facebookUsername = data.facebookUsername
  }
}

export class CreateRespondentResponse extends ApiResponse<RespondentData> {
  constructor(message: string, data: RespondentData) {
    super(message, data)
  }
}

export class GetRespondentsResponse extends PaginatedResponse<RespondentData> {
  constructor(
    currentPage: number,
    itemsPerPage: number,
    totalItems: number,
    totalPages: number,
    data: RespondentData[]
  ) {
    super(currentPage, itemsPerPage, totalItems, totalPages, data)
  }
}

export class GetRespondentResponse {
  readonly data: RespondentData
  
  constructor(data: RespondentData) {
    this.data = data
  }
}

export class UpdateRespondentResponse extends ApiResponse<RespondentData> {
  constructor(message: string, data: RespondentData) {
    super(message, data)
  }
}

export class DeleteRespondentResponse {
  readonly message: string
  
  constructor(message: string) {
    this.message = message
  }
}

// =============================================
// AUDIO RESPONSES
// =============================================

export class UploadAudioResponse extends ApiResponse<{ audioUrl: string }> {
  constructor(message: string, data: { audioUrl: string }) {
    super(message, data)
  }

  getAudioUrl(): string {
    return this.data.audioUrl
  }
}

// =============================================
// SOCIALIZER RESPONSES
// =============================================

export class SocializerData {
  public _id: string // Profile ID de la lista
  public fullName: string
  public idNumber: string
  public phone: string
  public coordinator?: string
  public location?: {
    lat: number
    long: number
  }
  public status: 'enabled' | 'disabled'
  public user: {
    _id: string // User ID
    email: string
    password?: string
    role: string | {
      _id: string
      role: string
    }
    status: string
    createdAt: string
    updatedAt: string
  }
  public profile?: any
  public email?: string
  public role?: any
  public createdAt: string
  public updatedAt: string

  constructor(data: any) {
    /**
     * Estructura de respuestas del API:
     * 
     * 1. GET /users/hierarchy (lista):
     * {
     *   _id: "profileId",
     *   fullName: "NAME",
     *   idNumber: "123",
     *   phone: "456",
     *   status: "enabled",
     *   user: {
     *     _id: "userId",
     *     email: "email@test.com",
     *     role: { _id: "roleId", role: "roleName" },
     *     status: "enabled"
     *   },
     *   profile?: {  // Coordinador padre si existe
     *     _id: "parentProfileId",
     *     fullName: "PARENT NAME",
     *     fieldCoordinator?: "...",
     *     zoneCoordinator?: "..."
     *   }
     * }
     * 
     * 2. GET /users/:id (individual):
     * {
     *   _id: "userId",
     *   email: "email@test.com",
     *   role: { _id: "roleId", role: "roleName" },
     *   status: "enabled",
     *   profile: {
     *     _id: "profileId",
     *     fullName: "NAME",
     *     idNumber: "123",
     *     phone: "456",
     *     status: "enabled",
     *     profile?: {  // Coordinador padre si existe
     *       _id: "parentProfileId",
     *       fullName: "PARENT NAME",
     *       fieldCoordinator?: "..."
     *     }
     *   }
     * }
     */
    
    // Detectar si es estructura de lista o get individual
    const isGetIndividual = data.email && data.profile && data.profile.fullName
    
    if (isGetIndividual) {
      // Estructura de GET /users/:id
      this._id = data.profile._id // profile ID
      this.fullName = data.profile.fullName
      this.idNumber = data.profile.idNumber
      this.phone = data.profile.phone
      this.status = data.profile.status || data.status
      this.location = data.profile.location
      this.createdAt = data.createdAt
      this.updatedAt = data.updatedAt
      
      // Construir objeto user
      this.user = {
        _id: data._id, // userId
        email: data.email,
        role: data.role,
        status: data.status,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      }
      
      // Propiedades opcionales
      this.email = data.email
      this.role = data.role
      this.profile = data.profile.profile // Coordinador padre
      
      // Coordinator del coordinador padre si existe
      if (data.profile.profile) {
        this.coordinator = data.profile.profile.fieldCoordinator || data.profile.profile.zoneCoordinator || data.profile.profile._id
      }
    } else {
      // Estructura de GET /users/hierarchy (lista)
      this._id = data._id // profile ID
      this.fullName = data.fullName
      this.idNumber = data.idNumber
      this.phone = data.phone
      this.status = data.status
      this.location = data.location
      this.createdAt = data.createdAt
      this.updatedAt = data.updatedAt
      
      // El objeto user
      this.user = {
        _id: data.user._id,
        email: data.user.email,
        role: data.user.role,
        status: data.user.status,
        createdAt: data.user.createdAt,
        updatedAt: data.user.updatedAt
      }
      
      // Propiedades opcionales
      this.email = data.user?.email
      this.role = data.user?.role
      this.profile = data.profile // Coordinador padre
      
      // Coordinator si existe
      if (data.profile) {
        this.coordinator = data.profile.fieldCoordinator || data.profile.zoneCoordinator || data.profile._id
      }
    }
  }

  isEnabled(): boolean {
    return this.status === 'enabled'
  }

  getRoleId(): string {
    const role = this.role || this.user?.role
    return typeof role === 'string' ? role : role?._id || ''
  }

  getRoleName(): string {
    const role = this.role || this.user?.role
    return typeof role === 'string' ? role : role?.role || ''
  }

  getUserId(): string {
    return this.user?._id || ''
  }

  getProfileId(): string {
    // Si tiene profile, _id es userId, sino es profileId
    return this.profile ? this.profile._id : this._id
  }
}

export class GetSocializersResponse extends PaginatedResponse<SocializerData> {
  constructor(
    currentPage: number,
    itemsPerPage: number,
    totalItems: number,
    totalPages: number,
    data: SocializerData[]
  ) {
    super(currentPage, itemsPerPage, totalItems, totalPages, data)
  }
}

export class GetSocializerResponse {
  readonly data: SocializerData
  
  constructor(data: SocializerData) {
    this.data = data
  }
}

export class CreateSocializerResponse extends ApiResponse<SocializerData> {
  constructor(message: string, data: SocializerData) {
    super(message, data)
  }
}

export class UpdateSocializerResponse extends ApiResponse<SocializerData> {
  constructor(message: string, data: SocializerData) {
    super(message, data)
  }
}

export class DeleteSocializerResponse {
  readonly message: string
  
  constructor(message: string) {
    this.message = message
  }
}

// =============================================
// ROLE RESPONSES
// =============================================

export class RoleData {
  public _id: string
  public role: string
  public status: string

  constructor(data: any) {
    this._id = data._id
    this.role = data.role
    this.status = data.status
  }

  isActive(): boolean {
    return this.status === 'enabled'
  }
}

export class GetRolesResponse {
  readonly data: RoleData[]
  
  constructor(data: RoleData[]) {
    this.data = data
  }

  getActiveRoles(): RoleData[] {
    return this.data.filter(role => role.isActive())
  }
}
