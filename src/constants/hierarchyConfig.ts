/**
 * Configuración de jerarquía de roles para el formulario de socializadores
 * Define qué campos puede ver/asignar cada rol
 */

export interface HierarchyLevel {
  role: string
  fieldKey: string
  label: string
  dataSourceField: 'zoneCoordinators' | 'fieldCoordinators' | 'supervisors'
  loadHierarchyRole: string
}

export interface RoleHierarchyConfig {
  visibleFields: HierarchyLevel[]
  autoSelectField?: string
  creatableRoles?: string[]
}

/**
 * Configuración de jerarquía por rol del usuario logueado
 * Solo muestra el dropdown del superior inmediato:
 *   socializer     -> supervisor
 *   supervisor     -> coordinador de campo
 *   fieldcoordinator -> coordinador de zona
 *   zonecoordinator -> (ninguno, es tope)
 */
export const ROLE_HIERARCHY_CONFIG: Record<string, RoleHierarchyConfig> = {
  admin: {
    visibleFields: [
      // Coordinador de campo requiere coordinador de zona
      {
        role: 'fieldcoordinator',
        fieldKey: 'assignedZoneCoordinator',
        label: 'Coordinador de Zona',
        dataSourceField: 'zoneCoordinators',
        loadHierarchyRole: 'zonecoordinator',
      },
      // Supervisor requiere coordinador de campo
      {
        role: 'supervisor',
        fieldKey: 'assignedFieldCoordinator',
        label: 'Coordinador de Campo',
        dataSourceField: 'fieldCoordinators',
        loadHierarchyRole: 'fieldcoordinator',
      },
      // Socializador requiere supervisor
      {
        role: 'socializer',
        fieldKey: 'assignedSupervisor',
        label: 'Supervisor',
        dataSourceField: 'supervisors',
        loadHierarchyRole: 'supervisor',
      },
    ],
    creatableRoles: ['readonly', 'zonecoordinator', 'fieldcoordinator', 'supervisor', 'socializer'],
  },
  readonly: {
    visibleFields: [],
    creatableRoles: [],
  },
  zonecoordinator: {
    visibleFields: [
      // Supervisor requiere coordinador de campo (bajo este coord. de zona)
      {
        role: 'supervisor',
        fieldKey: 'assignedFieldCoordinator',
        label: 'Coordinador de Campo',
        dataSourceField: 'fieldCoordinators',
        loadHierarchyRole: 'fieldcoordinator',
      },
      // Socializador requiere supervisor
      {
        role: 'socializer',
        fieldKey: 'assignedSupervisor',
        label: 'Supervisor',
        dataSourceField: 'supervisors',
        loadHierarchyRole: 'supervisor',
      },
    ],
    autoSelectField: 'assignedZoneCoordinator',
    creatableRoles: ['fieldcoordinator', 'supervisor', 'socializer'],
  },
  fieldcoordinator: {
    visibleFields: [
      // Socializador requiere supervisor (bajo este coord. de campo)
      {
        role: 'socializer',
        fieldKey: 'assignedSupervisor',
        label: 'Supervisor',
        dataSourceField: 'supervisors',
        loadHierarchyRole: 'supervisor',
      },
    ],
    autoSelectField: 'assignedFieldCoordinator',
    creatableRoles: ['supervisor', 'socializer'],
  },
  supervisor: {
    visibleFields: [],
    autoSelectField: 'assignedSupervisor',
    creatableRoles: ['socializer'],
  },
  socializer: {
    visibleFields: [],
    creatableRoles: [],
  },
}

/**
 * Obtiene la configuración de jerarquía para un rol
 */
export function getHierarchyConfig(userRole: string): RoleHierarchyConfig {
  return ROLE_HIERARCHY_CONFIG[userRole.toLowerCase()] || ROLE_HIERARCHY_CONFIG.admin
}

/**
 * Obtiene el campo que debe auto-seleccionarse para un rol
 */
export function getAutoSelectField(userRole: string): string | undefined {
  const config = getHierarchyConfig(userRole)
  return config.autoSelectField
}

/**
 * Obtiene los campos visibles para un rol según el rol seleccionado
 */
export function getVisibleFieldsForRole(userRole: string, selectedRole: string): HierarchyLevel[] {
  const config = getHierarchyConfig(userRole)
  return config.visibleFields.filter(field => field.role === selectedRole)
}
