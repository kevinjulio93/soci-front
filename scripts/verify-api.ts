/**
 * Script de Verificación - Validar Conexión API
 * Verifica que la API esté disponible y muestra información útil
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

/**
 * Realiza una petición HTTP genérica
 */
async function makeRequest<T>(method: string, endpoint: string): Promise<T | null> {
  const url = `${API_BASE_URL}${endpoint}`

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return null
    }

    const text = await response.text()
    const data = JSON.parse(text)
    return data as T
  } catch {
    return null
  }
}

/**
 * Verifica la conexión y disponibilidad de la API
 */
async function verifyAPI() {
  console.log('🔍 Verificando conexión con la API...\n')
  console.log(`📍 API URL: ${API_BASE_URL}\n`)

  console.log('═'.repeat(80))

  // 1. Verificar conectividad básica
  console.log('\n1️⃣  Verificando conectividad básica...')
  try {
    const response = await fetch(`${API_BASE_URL}/roles`, { method: 'GET' })
    if (response.ok) {
      console.log('   ✅ API accesible')
    } else {
      console.log(`   ⚠️  API respondió con status ${response.status}`)
    }
  } catch (error) {
    console.log('   ❌ No se puede conectar a la API')
    console.log(`   Error: ${error instanceof Error ? error.message : 'Desconocido'}`)
    console.log('\n💡 Soluciones posibles:')
    console.log('   1. Verifica que el servidor backend esté ejecutándose')
    console.log('   2. Verifica que la URL en .env.local sea correcta')
    console.log('   3. Si usas ngrok, la URL puede haber expirado')
    process.exit(1)
  }

  // 2. Verificar roles
  console.log('\n2️⃣  Verificando roles disponibles...')
  const roles = await makeRequest<{
    data: Array<{ _id: string; role: string }>
  }>('GET', '/roles')

  if (roles?.data) {
    const requiredRoles = ['admin', 'root', 'coordinador', 'coordinator', 'supervisor', 'socializador', 'socializer']
    const availableRoles = roles.data.map((r) => r.role)
    console.log(`   ✅ Roles encontrados: ${availableRoles.join(', ')}`)

    const adminRole = availableRoles.some((r) =>
      ['admin', 'root'].includes(r.toLowerCase())
    )
    const coordRole = availableRoles.some((r) =>
      ['coordinador', 'coordinator'].includes(r.toLowerCase())
    )
    const supervisorRole = availableRoles.some((r) =>
      r.toLowerCase() === 'supervisor'
    )
    const socializerRole = availableRoles.some((r) =>
      ['socializador', 'socializer'].includes(r.toLowerCase())
    )

    if (adminRole && coordRole && supervisorRole && socializerRole) {
      console.log('   ✅ Todos los roles necesarios están disponibles')
    } else {
      console.log('   ⚠️  Faltan algunos roles:')
      if (!adminRole) console.log('      - Admin/Root')
      if (!coordRole) console.log('      - Coordinador/Coordinator')
      if (!supervisorRole) console.log('      - Supervisor')
      if (!socializerRole) console.log('      - Socializador/Socializer')
    }
  } else {
    console.log('   ⚠️  No se pudieron recuperar los roles')
  }

  // 3. Verificar endpoints clave
  console.log('\n3️⃣  Verificando endpoints clave...')
  const endpoints = ['/roles', '/users/create-with-profile', '/respondents', '/socializers', '/auth/login']

  for (const endpoint of endpoints) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { method: 'OPTIONS' }).catch(() => null)
    const status = response ? '✅' : '⚠️'
    console.log(`   ${status} ${endpoint}`)
  }

  console.log('\n' + '═'.repeat(80))
  console.log('\n✨ Verificación completada')
  console.log('\n💡 Próximos pasos:')
  console.log('   1. Ver la estructura que se creará:')
  console.log('      npx ts-node scripts/seed-hierarchy-dry-run.ts')
  console.log('\n   2. Ejecutar el seeding real:')
  console.log('      npx ts-node scripts/seed-hierarchy.ts')
}

// Ejecutar
verifyAPI()
