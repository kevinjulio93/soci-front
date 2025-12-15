/**
 * Clases de datos para formularios
 * Proporcionan valores por defecto y métodos helper
 */

/**
 * Clase para datos de login
 */
export class LoginFormData {
  email: string
  password: string

  constructor(email: string = '', password: string = '') {
    this.email = email
    this.password = password
  }

  toFormData() {
    return {
      email: this.email,
      password: this.password,
    }
  }

  static empty(): LoginFormData {
    return new LoginFormData()
  }
}

/**
 * Clase para datos de socializador
 */
export class SocializerFormData {
  fullName: string
  idNumber: string
  email: string
  password: string
  roleId: string
  status: 'enabled' | 'disabled'

  constructor(
    fullName: string = '',
    idNumber: string = '',
    email: string = '',
    password: string = '',
    roleId: string = '',
    status: 'enabled' | 'disabled' = 'enabled'
  ) {
    this.fullName = fullName
    this.idNumber = idNumber
    this.email = email
    this.password = password
    this.roleId = roleId
    this.status = status
  }

  toFormData() {
    return {
      fullName: this.fullName,
      idNumber: this.idNumber,
      email: this.email,
      password: this.password,
      roleId: this.roleId,
      status: this.status,
    }
  }

  static empty(): SocializerFormData {
    return new SocializerFormData()
  }

  static fromPartial(data: Partial<SocializerFormData>): SocializerFormData {
    return new SocializerFormData(
      data.fullName || '',
      data.idNumber || '',
      data.email || '',
      data.password || '',
      data.roleId || '',
      data.status || 'enabled'
    )
  }
}
