/**
 * Modelo de Respondent usando POO
 * Encapsula la lógica de transformación de datos
 */

export type IdType = 'CC' | 'TI' | 'CE' | 'PA' | 'RC' | 'NIT' | ''
export type Gender = 'Masculino' | 'Femenino' | 'Otro' | 'Prefiero no decir' | ''
export type AgeRange = '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+' | ''
export type Stratum = '1' | '2' | '3' | '4' | '5' | '6' | ''

export interface RespondentDTO {
  _id?: string
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
  status?: string
  createdAt?: string
  updatedAt?: string
}

export class Respondent {
  private _fullName: string
  private _idType: IdType
  private _identification: string
  private _email: string
  private _phone: string
  private _address: string
  private _gender: Gender
  private _ageRange: AgeRange
  private _region: string
  private _department: string
  private _city: string
  private _stratum: Stratum
  private _neighborhood: string

  constructor(
    fullName: string = '',
    idType: IdType = '',
    identification: string = '',
    email: string = '',
    phone: string = '',
    address: string = '',
    gender: Gender = '',
    ageRange: AgeRange = '',
    region: string = '',
    department: string = '',
    city: string = '',
    stratum: Stratum = '',
    neighborhood: string = ''
  ) {
    this._fullName = fullName
    this._idType = idType
    this._identification = identification
    this._email = email
    this._phone = phone
    this._address = address
    this._gender = gender
    this._ageRange = ageRange
    this._region = region
    this._department = department
    this._city = city
    this._stratum = stratum
    this._neighborhood = neighborhood
  }

  // Getters
  get fullName(): string { return this._fullName }
  get idType(): IdType { return this._idType }
  get identification(): string { return this._identification }
  get email(): string { return this._email }
  get phone(): string { return this._phone }
  get address(): string { return this._address }
  get gender(): Gender { return this._gender }
  get ageRange(): AgeRange { return this._ageRange }
  get region(): string { return this._region }
  get department(): string { return this._department }
  get city(): string { return this._city }
  get stratum(): Stratum { return this._stratum }
  get neighborhood(): string { return this._neighborhood }

  // Método estático para crear desde DTO del backend
  static fromDTO(dto: RespondentDTO): Respondent {
    return new Respondent(
      dto.fullName,
      dto.idType as IdType,
      dto.identification,
      dto.email || '',
      dto.phone || '',
      dto.address || '',
      (dto.gender || '') as Gender,
      (dto.ageRange || '') as AgeRange,
      dto.region || '',
      dto.department || '',
      dto.city || '',
      (dto.stratum?.toString() || '') as Stratum,
      dto.neighborhood || ''
    )
  }

  // Método para convertir a formato de formulario
  toFormData(): {
    fullName: string
    idType: IdType
    identification: string
    email: string
    phone: string
    address: string
    gender: Gender
    ageRange: AgeRange
    region: string
    department: string
    city: string
    stratum: Stratum
    neighborhood: string
  } {
    return {
      fullName: this._fullName,
      idType: this._idType,
      identification: this._identification,
      email: this._email,
      phone: this._phone,
      address: this._address,
      gender: this._gender,
      ageRange: this._ageRange,
      region: this._region,
      department: this._department,
      city: this._city,
      stratum: this._stratum,
      neighborhood: this._neighborhood,
    }
  }

  // Método para convertir a DTO para enviar al backend
  toDTO(): {
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
  } {
    return {
      fullName: this._fullName,
      idType: this._idType,
      identification: this._identification,
      email: this._email || undefined,
      phone: this._phone || undefined,
      address: this._address || undefined,
      gender: this._gender || undefined,
      ageRange: this._ageRange || undefined,
      region: this._region || undefined,
      department: this._department || undefined,
      city: this._city || undefined,
      stratum: this._stratum || undefined,
      neighborhood: this._neighborhood || undefined,
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
    fullName: string
    idType: IdType
    identification: string
    email: string
    phone: string
    address: string
    gender: Gender
    ageRange: AgeRange
    region: string
    department: string
    city: string
    stratum: Stratum
    neighborhood: string
  }): Respondent {
    return new Respondent(
      data.fullName,
      data.idType,
      data.identification,
      data.email,
      data.phone,
      data.address,
      data.gender,
      data.ageRange,
      data.region,
      data.department,
      data.city,
      data.stratum,
      data.neighborhood
    )
  }
}
