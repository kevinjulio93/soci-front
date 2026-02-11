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
  phone: string
  email: string
  password: string
  roleId: string
  coordinator?: string
  assignedSupervisor?: string
  assignedFieldCoordinator?: string
  assignedZoneCoordinator?: string
  status: 'enabled' | 'disabled'

  constructor(
    fullName: string = '',
    idNumber: string = '',
    phone: string = '',
    email: string = '',
    password: string = '',
    roleId: string = '',
    coordinator: string = '',
    assignedSupervisor: string = '',
    assignedFieldCoordinator: string = '',
    assignedZoneCoordinator: string = '',
    status: 'enabled' | 'disabled' = 'enabled'
  ) {
    this.fullName = fullName
    this.idNumber = idNumber
    this.phone = phone
    this.email = email
    this.password = password
    this.roleId = roleId
    this.coordinator = coordinator
    this.assignedSupervisor = assignedSupervisor
    this.assignedFieldCoordinator = assignedFieldCoordinator
    this.assignedZoneCoordinator = assignedZoneCoordinator
    this.status = status
  }

  toFormData() {
    return {
      fullName: this.fullName,
      idNumber: this.idNumber,
      phone: this.phone,
      email: this.email,
      password: this.password,
      roleId: this.roleId,
      coordinator: this.coordinator,
      assignedSupervisor: this.assignedSupervisor,
      assignedFieldCoordinator: this.assignedFieldCoordinator,
      assignedZoneCoordinator: this.assignedZoneCoordinator,
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
      data.phone || '',
      data.email || '',
      data.password || '',
      data.roleId || '',
      data.coordinator || '',
      data.assignedSupervisor || '',
      data.assignedFieldCoordinator || '',
      data.assignedZoneCoordinator || '',
      data.status || 'enabled'
    )
  }
}
