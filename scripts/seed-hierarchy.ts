/**
 * Script de Seeding - Crear Jerarquía de Usuarios
 * 
 * Estructura:
 * - 1 Admin
 *   - 2 Coordinadores de Zona
 *     - 1 Coordinador de Campo (por zona)
 *       - 1 Supervisor (por coordinador de campo)
 *         - 2 Socializadores (por supervisor)
 *           - 2 Encuestas (por socializador)
 * 
 * Total esperado:
 * - 1 Admin
 * - 2 Coordinadores de Zona
 * - 2 Coordinadores de Campo
 * - 2 Supervisores
 * - 4 Socializadores
 * - 8 Encuestas
 */

import fetch from 'node-fetch'
import * as fs from 'fs'
import * as path from 'path'

// Cargar .env.local si existe
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach((line) => {
    const [key, value] = line.split('=')
    if (key && value && !process.env[key]) {
      process.env[key] = value.trim()
    }
  })
}

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1'

interface CreateUserResponse {
  message: string
  data: {
    _id: string
    email: string
    fullName: string
    idNumber: string
    phone: string
    role: { _id: string; role: string }
  }
}

interface CreateRespondentResponse {
  message: string
  data: {
    _id: string
    fullName: string
    idNumber: string
  }
}

interface RoleResponse {
  data: Array<{
    _id: string
    role: string
  }>
}

/**
 * Realiza una petición HTTP genérica
 */
async function makeRequest<T>(
  method: string,
  endpoint: string,
  body?: unknown,
  token?: string
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  console.log(`🔗 ${method} ${endpoint}`)
  
  const options: any = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  const response = await fetch(url, options)
  const text = await response.text()
  
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch (error) {
    console.error(`❌ Error parsing JSON response:`)
    console.error(`   Status: ${response.status}`)
    console.error(`   Response: ${text.substring(0, 500)}`)
    throw new Error(`Invalid JSON response from ${endpoint}`)
  }

  if (!response.ok) {
    throw new Error(
      `Error en ${endpoint}: ${response.status} - ${JSON.stringify(data)}`
    )
  }

  return data as T
}

/**
 * Obtiene los roles disponibles
 */
async function getRoles(): Promise<Map<string, string>> {
  console.log('📋 Obteniendo roles...')
  const response = await makeRequest<RoleResponse>('GET', '/roles')

  const roleMap = new Map<string, string>()
  response.data.forEach((role) => {
    const roleKey = role.role.toLowerCase()
    roleMap.set(roleKey, role._id)
  })

  console.log('✅ Roles obtenidos:', Array.from(roleMap.keys()))
  return roleMap
}

/**
 * Crea un usuario
 */
async function createUser(
  email: string,
  password: string,
  fullName: string,
  idNumber: string,
  phone: string,
  roleId: string,
  parentData?: {
    adminId?: string
    zoneCoordinatorId?: string
    fieldCoordinatorId?: string
    supervisorId?: string
  }
): Promise<CreateUserResponse['data']> {
  const payload: any = {
    email,
    password,
    roleId,
    profileData: {
      fullName,
      idNumber,
      phone,
    },
  }

  // Agregar referencias jerárquicas
  if (parentData?.adminId) payload.adminId = parentData.adminId
  if (parentData?.zoneCoordinatorId) payload.zoneCoordinatorId = parentData.zoneCoordinatorId
  if (parentData?.fieldCoordinatorId) payload.fieldCoordinatorId = parentData.fieldCoordinatorId
  if (parentData?.supervisorId) payload.supervisorId = parentData.supervisorId

  const response = await makeRequest<CreateUserResponse>(
    'POST',
    '/users/create-with-profile',
    payload
  )

  return response.data
}

/**
 * Crea un respondente (encuestado)
 */
async function createRespondent(
  fullName: string,
  idType: string,
  identification: string,
  phone: string,
  email: string,
  token: string
): Promise<CreateRespondentResponse['data']> {
  const payload = {
    fullName,
    idType,
    identification,
    phone,
    email,
    gender: 'Otro',
    ageRange: '25-34',
    city: 'Bogotá',
    neighborhood: 'Centro',
    stratum: '3',
  }

  const response = await makeRequest<CreateRespondentResponse>(
    'POST',
    '/respondents',
    payload,
    token
  )

  return response.data
}

/**
 * Realiza login de un usuario
 */
async function login(email: string, password: string): Promise<string> {
  const response = await makeRequest<{
    user: {
      token: string
    }
  }>('POST', '/auth/login', { email, password })

  return response.user.token
}

/**
 * Ejecuta el script de seeding
 */
async function seedHierarchy() {
  try {
    console.log('🌱 Iniciando creación de jerarquía de usuarios...')
    console.log(`📍 API Base URL: ${API_BASE_URL}\n`)

    // Validar que la API esté disponible
    try {
      await fetch(`${API_BASE_URL}/roles`)
    } catch (error) {
      throw new Error(
        `No se puede conectar a la API en ${API_BASE_URL}. Verifica que el servidor esté ejecutándose.`
      )
    }

    // Obtener roles
    const roles = await getRoles()
    const adminRoleId = roles.get('admin') || roles.get('root')
    const coordinatorRoleId = roles.get('coordinador') || roles.get('coordinator')
    const supervisorRoleId = roles.get('supervisor')
    const socializerRoleId = roles.get('socializador') || roles.get('socializer')

    if (!adminRoleId || !coordinatorRoleId || !supervisorRoleId || !socializerRoleId) {
      throw new Error('No se encontraron todos los roles necesarios')
    }

    // ==========================================
    // 1. CREAR ADMIN
    // ==========================================
    console.log('👤 Creando Admin...')
    const admin = await createUser(
      'admin.test@soci.app',
      'AdminTest123!',
      'Admin Test',
      '1234567890',
      '3012345678',
      adminRoleId
    )
    console.log(`✅ Admin creado: ${admin.fullName} (${admin.email})\n`)

    const adminToken = await login(admin.email, 'AdminTest123!')
    console.log('🔑 Token de Admin obtenido\n')

    // ==========================================
    // 2. CREAR COORDINADORES DE ZONA
    // ==========================================
    console.log('🏢 Creando 2 Coordinadores de Zona...')
    const zoneCoordinators = []

    for (let i = 1; i <= 2; i++) {
      const zoneCoord = await createUser(
        `zone.coordinator.${i}@soci.app`,
        `ZoneCoord${i}Test123!`,
        `Coordinador Zona ${i}`,
        `1100${1000 + i}`,
        `301000${1000 + i}`,
        coordinatorRoleId,
        { adminId: admin._id }
      )
      zoneCoordinators.push(zoneCoord)
      console.log(`  ✅ Coordinador Zona ${i}: ${zoneCoord.fullName} (${zoneCoord.email})`)
    }
    console.log()

    // ==========================================
    // 3. CREAR COORDINADORES DE CAMPO Y SUPERVISORES Y SOCIALIZADORES
    // ==========================================
    const socializersByZone: Map<string, Array<{ _id: string; email: string; password: string }>> = new Map()

    for (let zIdx = 0; zIdx < zoneCoordinators.length; zIdx++) {
      const zoneCoord = zoneCoordinators[zIdx]
      console.log(`\n🔷 Zona ${zIdx + 1}: ${zoneCoord.fullName}`)
      console.log('─'.repeat(50))

      // Crear 1 Coordinador de Campo por Zona
      console.log('  🏭 Creando Coordinador de Campo...')
      const fieldCoord = await createUser(
        `field.coordinator.zone${zIdx + 1}@soci.app`,
        `FieldCoord${zIdx + 1}Test123!`,
        `Coordinador Campo - Zona ${zIdx + 1}`,
        `1200${1000 + zIdx}`,
        `302000${1000 + zIdx}`,
        coordinatorRoleId,
        { adminId: admin._id, zoneCoordinatorId: zoneCoord._id }
      )
      console.log(`    ✅ ${fieldCoord.fullName} (${fieldCoord.email})`)

      // Crear 1 Supervisor por Coordinador de Campo
      console.log('  👨‍💼 Creando Supervisor...')
      const supervisor = await createUser(
        `supervisor.zone${zIdx + 1}@soci.app`,
        `Supervisor${zIdx + 1}Test123!`,
        `Supervisor - Zona ${zIdx + 1}`,
        `1300${1000 + zIdx}`,
        `303000${1000 + zIdx}`,
        supervisorRoleId,
        {
          adminId: admin._id,
          zoneCoordinatorId: zoneCoord._id,
          fieldCoordinatorId: fieldCoord._id,
        }
      )
      console.log(`    ✅ ${supervisor.fullName} (${supervisor.email})`)

      // Crear 2 Socializadores por Supervisor
      console.log('  👥 Creando 2 Socializadores...')
      const socializersInZone = []

      for (let sIdx = 1; sIdx <= 2; sIdx++) {
        const password = `Socializer${zIdx + 1}_${sIdx}Test123!`
        const socializer = await createUser(
          `socializer.zone${zIdx + 1}_${sIdx}@soci.app`,
          password,
          `Socializador - Zona ${zIdx + 1} #${sIdx}`,
          `1400${1000 + zIdx}${sIdx}`,
          `304000${1000 + zIdx}${sIdx}`,
          socializerRoleId,
          {
            adminId: admin._id,
            zoneCoordinatorId: zoneCoord._id,
            fieldCoordinatorId: fieldCoord._id,
            supervisorId: supervisor._id,
          }
        )
        socializersInZone.push({
          _id: socializer._id,
          email: socializer.email,
          password,
        })
        console.log(`    ✅ ${socializer.fullName} (${socializer.email})`)
      }

      socializersByZone.set(zoneCoord._id, socializersInZone)
    }

    console.log('\n')

    // ==========================================
    // 4. CREAR ENCUESTAS POR SOCIALIZADOR
    // ==========================================
    console.log('📝 Creando encuestas para cada socializador...')
    console.log('─'.repeat(50))

    let totalSurveys = 0

    for (const [zoneId, socializers] of socializersByZone.entries()) {
      for (const socializer of socializers) {
        // Login del socializador
        const socializerToken = await login(socializer.email, socializer.password)

        // Crear 2 encuestas
        for (let surveyIdx = 1; surveyIdx <= 2; surveyIdx++) {
          const respondent = await createRespondent(
            `Respondent - ${socializer.email} #${surveyIdx}`,
            'CC',
            `${3000000000 + totalSurveys}`,
            `305000${totalSurveys}`,
            `respondent.${totalSurveys}@soci.app`,
            socializerToken
          )
          console.log(
            `  ✅ Encuesta ${surveyIdx}: ${respondent.fullName} (ID: ${respondent.idNumber})`
          )
          totalSurveys++
        }
        console.log()
      }
    }

    // ==========================================
    // RESUMEN FINAL
    // ==========================================
    console.log('\n' + '═'.repeat(50))
    console.log('✨ SEEDING COMPLETADO EXITOSAMENTE')
    console.log('═'.repeat(50))
    console.log(`
📊 RESUMEN:
  👤 Admins: 1
  🏢 Coordinadores de Zona: 2
  🏭 Coordinadores de Campo: 2
  👨‍💼 Supervisores: 2
  👥 Socializadores: 4
  📝 Encuestas: 8

🔑 CREDENCIALES DE PRUEBA:
  Admin:
    Email: admin.test@soci.app
    Password: AdminTest123!

  Ejemplo Socializador:
    Email: socializer.zone1_1@soci.app
    Password: Socializer1_1Test123!
    `)
  } catch (error) {
    console.error('❌ Error durante el seeding:', error)
    process.exit(1)
  }
}

// Ejecutar
seedHierarchy()
