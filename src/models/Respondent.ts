/**
 * Modelo de Respondent usando POO
 * Encapsula la lógica de transformación de datos
 */

export type IdType = 'CC' | 'TI' | 'CE' | 'PA' | 'RC' | 'NIT' | ''
export type Gender = 'Masculino' | 'Femenino' | 'Otro' | 'Prefiero no decir' | ''
export type AgeRange = '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+' | ''
export type Stratum = '1' | '2' | '3' | '4' | '5' | '6' | ''
export type SurveyStatus = 'successful' | 'unsuccessful' | ''
export type NoResponseReason = 'no_interest' | 'no_time' | 'not_home' | 'privacy_concerns' | 'other' | ''

export interface RespondentDTO {
  _id?: string
  willingToRespond?: boolean
  recordingAuthorization?: boolean
  visitAddress?: string
  surveyStatus?: string
  noResponseReason?: string
  rejectionReason?: string
  fullName?: string
  idType?: string
  identification?: string
  email?: string
  phone?: string
  facebookUsername?: string
  address?: string
  gender?: string
  ageRange?: string
  region?: string
  department?: string
  city?: string
  stratum?: number
  neighborhood?: string
  latitude?: number
  longitude?: number
  defendorDePatria?: boolean
  isPatriaDefender?: boolean
  isLinkedHouse?: boolean
  status?: string
  createdAt?: string
  updatedAt?: string
}

export class Respondent {
  private _willingToRespond: boolean
  private _recordingAuthorization: boolean
  private _visitAddress: string
  private _surveyStatus: SurveyStatus
  private _noResponseReason: NoResponseReason
  private _fullName: string
  private _idType: IdType
  private _identification: string
  private _email: string
  private _phone: string
  private _facebookUsername: string
  private _address: string
  private _gender: Gender
  private _ageRange: AgeRange
  private _region: string
  private _department: string
  private _city: string
  private _stratum: Stratum
  private _neighborhood: string
  private _latitude: number
  private _longitude: number
  private _defendorDePatria: boolean
  private _isLinkedHouse: boolean

  constructor(
    willingToRespond: boolean = false,
    recordingAuthorization: boolean = false,
    visitAddress: string = '',
    surveyStatus: SurveyStatus = '',
    noResponseReason: NoResponseReason = '',
    fullName: string = '',
    idType: IdType = '',
    identification: string = '',
    email: string = '',
    phone: string = '',
    facebookUsername: string = '',
    address: string = '',
    gender: Gender = '',
    ageRange: AgeRange = '',
    region: string = '',
    department: string = '',
    city: string = '',
    stratum: Stratum = '',
    neighborhood: string = '',
    latitude: number = 0,
    longitude: number = 0,
    defendorDePatria: boolean = false,
    isLinkedHouse: boolean = false
  ) {
    this._willingToRespond = willingToRespond
    this._recordingAuthorization = recordingAuthorization
    this._visitAddress = visitAddress
    this._surveyStatus = surveyStatus
    this._noResponseReason = noResponseReason
    this._fullName = fullName
    this._idType = idType
    this._identification = identification
    this._email = email
    this._phone = phone
    this._facebookUsername = facebookUsername
    this._address = address
    this._gender = gender
    this._ageRange = ageRange
    this._region = region
    this._department = department
    this._city = city
    this._stratum = stratum
    this._neighborhood = neighborhood
    this._latitude = latitude
    this._longitude = longitude
    this._defendorDePatria = defendorDePatria
    this._isLinkedHouse = isLinkedHouse
  }

  // Getters
  get willingToRespond(): boolean { return this._willingToRespond }
  get recordingAuthorization(): boolean { return this._recordingAuthorization }
  get visitAddress(): string { return this._visitAddress }
  get surveyStatus(): SurveyStatus { return this._surveyStatus }
  get noResponseReason(): NoResponseReason { return this._noResponseReason }
  get fullName(): string { return this._fullName }
  get idType(): IdType { return this._idType }
  get identification(): string { return this._identification }
  get email(): string { return this._email }
  get phone(): string { return this._phone }
  get facebookUsername(): string { return this._facebookUsername }
  get address(): string { return this._address }
  get gender(): Gender { return this._gender }
  get ageRange(): AgeRange { return this._ageRange }
  get region(): string { return this._region }
  get department(): string { return this._department }
  get city(): string { return this._city }
  get stratum(): Stratum { return this._stratum }
  get neighborhood(): string { return this._neighborhood }
  get latitude(): number { return this._latitude }
  get longitude(): number { return this._longitude }
  get defendorDePatria(): boolean { return this._defendorDePatria }
  get isLinkedHouse(): boolean { return this._isLinkedHouse }

  // Método estático para crear desde DTO del backend
  static fromDTO(dto: RespondentDTO): Respondent {
    const noResponseReason = ((dto.noResponseReason || dto.rejectionReason) || '') as NoResponseReason
    
    return new Respondent(
      dto.willingToRespond || false,
      dto.recordingAuthorization || false,
      dto.visitAddress || '',
      (dto.surveyStatus || '') as SurveyStatus,
      noResponseReason,
      dto.fullName || '',
      (dto.idType || '') as IdType,
      dto.identification || '',
      dto.email || '',
      dto.phone || '',
      dto.facebookUsername || '',
      dto.address || '',
      (dto.gender || '') as Gender,
      (dto.ageRange || '') as AgeRange,
      dto.region || '',
      dto.department || '',
      dto.city || '',
      (dto.stratum?.toString() || '') as Stratum,
      dto.neighborhood || '',
      dto.latitude || 0,
      dto.longitude || 0,
      dto.defendorDePatria || dto.isPatriaDefender || false,
      dto.isLinkedHouse || false
    )
  }

  // Método para convertir a formato de formulario
  toFormData(): {
    willingToRespond: boolean | string
    audioRecordingConsent: boolean | string
    visitAddress: string
    surveyStatus: SurveyStatus
    noResponseReason: NoResponseReason
    fullName: string
    idType: IdType
    identification: string
    email: string
    phone: string
    facebookUsername: string
    address: string
    gender: Gender
    ageRange: AgeRange
    region: string
    department: string
    city: string
    stratum: Stratum
    neighborhood: string
    latitude: number
    longitude: number
    defendorDePatria: boolean
    isLinkedHouse: boolean
  } {
    return {
      willingToRespond: this._willingToRespond ? 'true' : 'false',
      audioRecordingConsent: this._recordingAuthorization ? 'true' : 'false',
      visitAddress: this._visitAddress,
      surveyStatus: this._surveyStatus,
      noResponseReason: this._noResponseReason,
      fullName: this._fullName,
      idType: this._idType,
      identification: this._identification,
      email: this._email,
      phone: this._phone,
      facebookUsername: this._facebookUsername,
      address: this._address,
      gender: this._gender,
      ageRange: this._ageRange,
      region: this._region,
      department: this._department,
      city: this._city,
      stratum: this._stratum,
      neighborhood: this._neighborhood,
      latitude: this._latitude,
      longitude: this._longitude,
      defendorDePatria: this._defendorDePatria,
      isLinkedHouse: this._isLinkedHouse,
    }
  }

  // Método para convertir a DTO para enviar al backend
  toDTO(): {
    willingToRespond: boolean
    recordingAuthorization: boolean
    visitAddress: string
    surveyStatus: string
    noResponseReason?: string
    fullName: string
    idType: string
    identification: string
    email?: string
    phone?: string
    facebook?: string
    address?: string
    gender?: string
    ageRange?: string
    region?: string
    department?: string
    city?: string
    stratum?: string
    neighborhood?: string
    latitude?: number
    longitude?: number
    defendorDePatria?: boolean
    isLinkedHouse?: boolean
    isPatriaDefender?: boolean
    rejectionReason?: string
  } {
    return {
      willingToRespond: this._willingToRespond,
      recordingAuthorization: this._recordingAuthorization,
      visitAddress: this._visitAddress,
      surveyStatus: this._surveyStatus,
      noResponseReason: this._noResponseReason || undefined,
      rejectionReason: this._noResponseReason || undefined,
      fullName: this._fullName,
      idType: this._idType,
      identification: this._identification,
      email: this._email || undefined,
      phone: this._phone || undefined,
      facebook: this._facebookUsername || undefined,
      address: this._address || undefined,
      gender: this._gender || undefined,
      ageRange: this._ageRange || undefined,
      region: this._region || undefined,
      department: this._department || undefined,
      city: this._city || undefined,
      stratum: this._stratum || undefined,
      neighborhood: this._neighborhood || undefined,
      // Enviar coordenadas siempre, incluso si son 0 (el backend debe manejar esto)
      latitude: this._latitude,
      longitude: this._longitude,
      defendorDePatria: this._defendorDePatria,
      isLinkedHouse: this._isLinkedHouse,
      isPatriaDefender: this._defendorDePatria,
    }
  }

  // Validación básica
  isValid(): boolean {
    return !!(
      this._fullName.trim() &&
      this._idType &&
      this._identification.trim()
    )
  }

  // Método estático para crear desde datos de formulario
  static fromFormData(data: {
    willingToRespond: boolean
    audioRecordingConsent: boolean
    visitAddress: string
    surveyStatus: SurveyStatus
    noResponseReason: NoResponseReason
    fullName: string
    idType: IdType
    identification: string
    email: string
    phone: string
    facebookUsername: string
    address: string
    gender: Gender
    ageRange: AgeRange
    region: string
    department: string
    city: string
    stratum: Stratum
    neighborhood: string
    latitude: number
    longitude: number
    defendorDePatria: boolean
    isLinkedHouse: boolean
  }): Respondent {
    return new Respondent(
      data.willingToRespond,
      data.audioRecordingConsent,
      data.visitAddress,
      data.surveyStatus,
      data.noResponseReason,
      data.fullName,
      data.idType,
      data.identification,
      data.email,
      data.phone,
      data.facebookUsername,
      data.address,
      data.gender,
      data.ageRange,
      data.region,
      data.department,
      data.city,
      data.stratum,
      data.neighborhood,
      data.latitude,
      data.longitude,
      data.defendorDePatria,
      data.isLinkedHouse
    )
  }
}
