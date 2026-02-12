/**
 * Script de Seeding - Dry Run (Solo visualización)
 * Muestra la estructura que se creará sin hacer peticiones reales
 */

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

interface UserData {
  type: string
  name: string
  email: string
  password: string
  id: string
  level: number
  parentName?: string
}

/**
 * Ejecuta el dry run
 */
function seedHierarchyDryRun() {
  const users: UserData[] = []

  console.log('🌍 DRY RUN - Visualización de la jerarquía que se creará')
  console.log(`📍 API: ${API_BASE_URL}\n`)
  console.log('═'.repeat(80))

  // Admin
  const adminData: UserData = {
    type: 'Admin',
    name: 'Admin Test',
    email: 'admin.test@soci.app',
    password: 'AdminTest123!',
    id: 'admin-1',
    level: 0,
  }
  users.push(adminData)

  console.log('\n👤 ADMIN')
  console.log(`   Email: ${adminData.email}`)
  console.log(`   Password: ${adminData.password}`)
  console.log(`   ID Number: 1234567890`)
  console.log(`   Phone: 3012345678\n`)

  // Coordinadores de Zona
  console.log('🏢 COORDINADORES DE ZONA')
  const zoneCoordinators = []
  for (let i = 1; i <= 2; i++) {
    const zoneCoordData: UserData = {
      type: 'Coordinador de Zona',
      name: `Coordinador Zona ${i}`,
      email: `zone.coordinator.${i}@soci.app`,
      password: `ZoneCoord${i}Test123!`,
      id: `zone-coord-${i}`,
      level: 1,
      parentName: 'Admin Test',
    }
    zoneCoordinators.push(zoneCoordData)
    users.push(zoneCoordData)

    console.log(`\n   ${i}. ${zoneCoordData.name}`)
    console.log(`      Email: ${zoneCoordData.email}`)
    console.log(`      Password: ${zoneCoordData.password}`)
    console.log(`      ID Number: 110${1000 + i}`)
    console.log(`      Phone: 301000${1000 + i}`)

    // Coordinadores de Campo
    console.log(`\n   🏭 Coordinador de Campo (Zona ${i})`)
    const fieldCoordData: UserData = {
      type: 'Coordinador de Campo',
      name: `Coordinador Campo - Zona ${i}`,
      email: `field.coordinator.zone${i}@soci.app`,
      password: `FieldCoord${i}Test123!`,
      id: `field-coord-${i}`,
      level: 2,
      parentName: zoneCoordData.name,
    }
    users.push(fieldCoordData)

    console.log(`      Email: ${fieldCoordData.email}`)
    console.log(`      Password: ${fieldCoordData.password}`)
    console.log(`      ID Number: 120${1000 + i}`)
    console.log(`      Phone: 302000${1000 + i}`)

    // Supervisor
    console.log(`\n   👨‍💼 Supervisor (Zona ${i})`)
    const supervisorData: UserData = {
      type: 'Supervisor',
      name: `Supervisor - Zona ${i}`,
      email: `supervisor.zone${i}@soci.app`,
      password: `Supervisor${i}Test123!`,
      id: `supervisor-${i}`,
      level: 3,
      parentName: fieldCoordData.name,
    }
    users.push(supervisorData)

    console.log(`      Email: ${supervisorData.email}`)
    console.log(`      Password: ${supervisorData.password}`)
    console.log(`      ID Number: 130${1000 + i}`)
    console.log(`      Phone: 303000${1000 + i}`)

    // Socializadores
    console.log(`\n   👥 Socializadores (Zona ${i})`)
    for (let sIdx = 1; sIdx <= 2; sIdx++) {
      const socializerData: UserData = {
        type: 'Socializador',
        name: `Socializador - Zona ${i} #${sIdx}`,
        email: `socializer.zone${i}_${sIdx}@soci.app`,
        password: `Socializer${i}_${sIdx}Test123!`,
        id: `socializer-${i}-${sIdx}`,
        level: 4,
        parentName: supervisorData.name,
      }
      users.push(socializerData)

      console.log(`\n      ${sIdx}. ${socializerData.name}`)
      console.log(`         Email: ${socializerData.email}`)
      console.log(`         Password: ${socializerData.password}`)
      console.log(`         ID Number: 140${1000 + i}${sIdx}`)
      console.log(`         Phone: 304000${1000 + i}${sIdx}`)

      // Encuestas
      console.log(`         📝 Encuestas:`)
      for (let surveyIdx = 1; surveyIdx <= 2; surveyIdx++) {
        const respondentNum =
          (i - 1) * 2 * 2 + (sIdx - 1) * 2 + surveyIdx
        console.log(
          `            ${surveyIdx}. Respondent - ${socializerData.email} #${surveyIdx}`
        )
        console.log(`               ID: CC ${3000000000 + respondentNum}`)
        console.log(
          `               Email: respondent.${respondentNum}@soci.app`
        )
      }
    }
  }

  // Resumen
  console.log('\n' + '═'.repeat(80))
  console.log('\n📊 RESUMEN')
  console.log(`   Admins: 1`)
  console.log(`   Coordinadores de Zona: 2`)
  console.log(`   Coordinadores de Campo: 2`)
  console.log(`   Supervisores: 2`)
  console.log(`   Socializadores: 4`)
  console.log(`   Encuestas: 8`)
  console.log(`\n   Total de usuarios a crear: ${users.length}`)

  // Exportar CSV de credenciales
  console.log('\n📋 Exportando credenciales...')
  const csvHeader = 'Tipo,Nombre,Email,Contraseña,ID,Nivel\n'
  const csvRows = users
    .map(
      (u) =>
        `${u.type},"${u.name}","${u.email}","${u.password}",${u.id},${u.level}`
    )
    .join('\n')

  const csvPath = path.join(process.cwd(), 'credentials-dry-run.csv')
  fs.writeFileSync(csvPath, csvHeader + csvRows)
  console.log(`   ✅ Archivo de credenciales: ${csvPath}`)

  // JSON
  const jsonPath = path.join(process.cwd(), 'hierarchy-dry-run.json')
  fs.writeFileSync(
    jsonPath,
    JSON.stringify(
      {
        api_url: API_BASE_URL,
        created_at: new Date().toISOString(),
        total_users: users.length,
        users,
      },
      null,
      2
    )
  )
  console.log(`   ✅ Archivo de jerarquía: ${jsonPath}`)

  console.log('\n✨ Dry run completado exitosamente')
  console.log(
    '\n💡 Para ejecutar el seeding real, usa: npx ts-node scripts/seed-hierarchy.ts'
  )
}

// Ejecutar
seedHierarchyDryRun()
