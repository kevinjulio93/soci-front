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
  public fullName: string
  public idType: string
  public identification: string
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
  public audioPath?: string
  public audioUrl?: string | null
  public audioFile?: string
  public audioFileKey?: string
  public autor?: any

  constructor(data: any) {
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
    this.department = data.department
    this.city = data.city
    this.stratum = data.stratum
    this.neighborhood = data.neighborhood
    this.audioPath = data.audioPath
    this.audioUrl = data.audioUrl
    this.audioFile = data.audioFile
    this.audioFileKey = data.audioFileKey
    this.autor = data.autor
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
  public _id: string
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
    _id: string
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
  public createdAt: string
  public updatedAt: string

  constructor(data: any) {
    this._id = data._id
    this.fullName = data.fullName
    this.idNumber = data.idNumber
    this.phone = data.phone
    this.coordinator = data.coordinator
    this.location = data.location
    this.status = data.status
    this.user = data.user
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }

  isEnabled(): boolean {
    return this.status === 'enabled'
  }

  getRoleId(): string {
    return typeof this.user.role === 'string' ? this.user.role : this.user.role._id
  }

  getRoleName(): string {
    return typeof this.user.role === 'string' ? this.user.role : this.user.role.role
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
