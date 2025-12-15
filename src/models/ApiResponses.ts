/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Modelos de respuestas de API
 * Usar clases para crear instancias con métodos helper
 */

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
  email: string
  password: string
  roleId: string
  location?: {
    lat: number
    long: number
  }
  status?: 'enabled' | 'disabled'
}

export interface UpdateSocializerRequest {
  fullName?: string
  idNumber?: string
  email?: string
  password?: string
  roleId?: string
  location?: {
    lat: number
    long: number
  }
  status?: 'enabled' | 'disabled'
}

// =============================================
// BASE RESPONSE CLASSES
// =============================================

export class ApiResponse<T> {
  constructor(
    public message: string,
    public data: T
  ) {}
}

export class PaginatedResponse<T> {
  constructor(
    public currentPage: number,
    public itemsPerPage: number,
    public totalItems: number,
    public totalPages: number,
    public data: T[]
  ) {}

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
  constructor(public data: RespondentData) {}
}

export class UpdateRespondentResponse extends ApiResponse<RespondentData> {
  constructor(message: string, data: RespondentData) {
    super(message, data)
  }
}

export class DeleteRespondentResponse {
  constructor(public message: string) {}
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
  public location: {
    lat: number
    long: number
  }
  public status: 'enabled' | 'disabled'
  public user: {
    _id: string
    email: string
    role: {
      _id: string
      role: string
    }
  }
  public createdAt: string
  public updatedAt: string

  constructor(data: any) {
    this._id = data._id
    this.fullName = data.fullName
    this.idNumber = data.idNumber
    this.location = data.location
    this.status = data.status
    this.user = data.user
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }

  isEnabled(): boolean {
    return this.status === 'enabled'
  }

  getRoleName(): string {
    return this.user.role.role
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
  constructor(public data: SocializerData) {}
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
  constructor(public message: string) {}
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
  constructor(public data: RoleData[]) {}

  getActiveRoles(): RoleData[] {
    return this.data.filter(role => role.isActive())
  }
}
