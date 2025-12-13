# Ejemplos Prácticos - Soci App Frontend

Esta guía muestra ejemplos reales de cómo usar la arquitectura SOLID en diferentes escenarios.

---

## 1. Agregar una Nueva Funcionalidad: Sistema de Notificaciones

### Paso 1: Crear tipos

**`src/types/index.ts`** - Agregar:
```typescript
export interface Notification {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

export interface NotificationService {
  show: (notification: Notification) => void
  remove: (id: string) => void
}
```

### Paso 2: Crear servicio

**`src/services/notification.service.ts`** - Nuevo archivo:
```typescript
import type { Notification } from '../types'

class NotificationService {
  private notifications: Map<string, Notification> = new Map()
  private listeners: ((notifications: Notification[]) => void)[] = []

  show(notification: Notification): void {
    const id = notification.id || Date.now().toString()
    const notif = { ...notification, id }
    this.notifications.set(id, notif)
    this.notifyListeners()

    // Auto-remove después de duration
    if (notif.duration) {
      setTimeout(() => this.remove(id), notif.duration)
    }
  }

  remove(id: string): void {
    this.notifications.delete(id)
    this.notifyListeners()
  }

  getAll(): Notification[] {
    return Array.from(this.notifications.values())
  }

  subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getAll()))
  }
}

export const notificationService = new NotificationService()
```

### Paso 3: Crear contexto

**`src/contexts/NotificationContext.tsx`** - Nuevo archivo:
```typescript
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { Notification } from '../types'
import { notificationService } from '../services/notification.service'

interface NotificationContextType {
  notifications: Notification[]
  show: (notification: Notification) => void
  remove: (id: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(setNotifications)
    return unsubscribe
  }, [])

  const show = useCallback((notification: Notification) => {
    notificationService.show(notification)
  }, [])

  const remove = useCallback((id: string) => {
    notificationService.remove(id)
  }, [])

  return (
    <NotificationContext.Provider value={{ notifications, show, remove }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotification(): NotificationContextType {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification debe ser usado dentro de NotificationProvider')
  }
  return context
}
```

### Paso 4: Crear componentes

**`src/components/NotificationContainer.tsx`** - Nuevo:
```typescript
import { useNotification } from '../contexts/NotificationContext'
import '../styles/Notification.scss'

export function NotificationContainer() {
  const { notifications, remove } = useNotification()

  return (
    <div className="notification-container">
      {notifications.map(notification => (
        <div key={notification.id} className={`notification notification-${notification.type}`}>
          <p>{notification.message}</p>
          <button onClick={() => remove(notification.id)}>×</button>
        </div>
      ))}
    </div>
  )
}
```

### Paso 5: Usar en la app

**`src/main.tsx`** - Modificar:
```typescript
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <NotificationProvider>
        <RouterProvider router={router} />
        <NotificationContainer />
      </NotificationProvider>
    </AuthProvider>
  </StrictMode>,
)
```

### Paso 6: Usar en componentes

```typescript
import { useNotification } from '../contexts/NotificationContext'

export function MyComponent() {
  const { show } = useNotification()

  const handleSuccess = () => {
    show({
      id: 'success-1',
      message: '✅ Operación exitosa',
      type: 'success',
      duration: 3000,
    })
  }

  const handleError = () => {
    show({
      id: 'error-1',
      message: '❌ Error en la operación',
      type: 'error',
      duration: 5000,
    })
  }

  return (
    <button onClick={handleSuccess}>Éxito</button>
    <button onClick={handleError}>Error</button>
  )
}
```

---

## 2. Agregar una Nueva Página: Perfil de Usuario

### Estructura

```
Paso 1: Tipos → Paso 2: Servicio → Paso 3: Componentes → Paso 4: Página → Paso 5: Ruta
```

### Paso 1: Tipos

**`src/types/index.ts`** - Agregar:
```typescript
export interface UserProfile extends User {
  firstName: string
  lastName: string
  phone: string
  address: string
  bio: string
}
```

### Paso 2: Servicio

**`src/services/user.service.ts`** - Nuevo:
```typescript
import type { UserProfile } from '../types'
import { apiService } from './api.service'

class UserService {
  async getProfile(): Promise<UserProfile> {
    return apiService.request<UserProfile>('/user/profile')
  }

  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    return apiService.request<UserProfile>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    })
  }
}

export const userService = new UserService()
```

### Paso 3: Componentes

**`src/components/ProfileForm.tsx`** - Nuevo:
```typescript
import { useForm } from 'react-hook-form'
import type { UserProfile } from '../types'

interface ProfileFormProps {
  profile: UserProfile | null
  onSubmit: (data: Partial<UserProfile>) => Promise<void>
  isLoading?: boolean
}

export function ProfileForm({ profile, onSubmit, isLoading }: ProfileFormProps) {
  const { register, handleSubmit } = useForm<Partial<UserProfile>>({
    defaultValues: profile || undefined,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('firstName')} placeholder="Nombre" />
      <input {...register('lastName')} placeholder="Apellido" />
      <input {...register('phone')} placeholder="Teléfono" />
      <textarea {...register('bio')} placeholder="Biografía" />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Guardando...' : 'Guardar Cambios'}
      </button>
    </form>
  )
}
```

### Paso 4: Página

**`src/pages/UserProfile.tsx`** - Nuevo:
```typescript
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useNotification } from '../contexts/NotificationContext'
import { DashboardHeader, ProfileForm } from '../components'
import { userService } from '../services/user.service'
import type { UserProfile } from '../types'

export default function UserProfile() {
  const { user, logout } = useAuth()
  const { show } = useNotification()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setIsLoading(true)
      const data = await userService.getProfile()
      setProfile(data)
    } catch (error) {
      show({
        message: 'Error al cargar perfil',
        type: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateProfile = async (data: Partial<UserProfile>) => {
    try {
      const updated = await userService.updateProfile(data)
      setProfile(updated)
      show({
        message: '✅ Perfil actualizado',
        type: 'success',
        duration: 3000,
      })
    } catch (error) {
      show({
        message: '❌ Error al actualizar',
        type: 'error',
      })
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="dashboard-container">
      <DashboardHeader
        title="Mi Perfil"
        user={user}
        onLogout={handleLogout}
      />
      <main className="dashboard-main">
        <ProfileForm
          profile={profile}
          onSubmit={handleUpdateProfile}
          isLoading={isLoading}
        />
      </main>
    </div>
  )
}
```

### Paso 5: Ruta

**`src/routes/index.tsx`** - Agregar:
```typescript
{
  path: '/profile',
  element: (
    <ProtectedRoute allowedRoles={['admin', 'sociologist']}>
      <UserProfile />
    </ProtectedRoute>
  ),
}
```

---

## 3. Extender un Servicio Existente

### Antes: Servicio limpio
```typescript
class ApiService {
  async login(credentials: LoginCredentials): Promise<LoginResponse> { ... }
  async logout(): Promise<void> { ... }
}
```

### Después: Agregar método sin romper código existente

```typescript
class ApiService {
  // ✅ Métodos existentes siguen funcionando
  async login(credentials: LoginCredentials): Promise<LoginResponse> { ... }
  async logout(): Promise<void> { ... }

  // ✅ Nuevo método agregado - Abierto para extensión
  async fetchUser(id: string): Promise<User> {
    return this.request<User>(`/users/${id}`)
  }

  // ✅ Otro nuevo método
  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return this.request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }
}

// ✅ El código existente no cambió
const user = await authService.login(credentials)

// ✅ Nuevo código usa los nuevos métodos
const userProfile = await apiService.fetchUser('123')
```

---

## 4. Crear un Componente Reutilizable

### Análisis: Identificar patrón

Vemos que necesitamos mostrar listas en diferentes lugares:
- Usuarios
- Encuestas
- Mensajes
- Reportes

### Solución: Componente genérico

**`src/components/DataTable.tsx`**:
```typescript
import type { ReactNode } from 'react'

export interface Column<T> {
  key: keyof T
  label: string
  render?: (value: T[keyof T], item: T) => ReactNode
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onRowClick?: (item: T) => void
  loading?: boolean
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  onRowClick,
  loading,
}: DataTableProps<T>) {
  if (loading) return <div>Cargando...</div>
  if (!data.length) return <div>No hay datos</div>

  return (
    <table>
      <thead>
        <tr>
          {columns.map(col => (
            <th key={String(col.key)}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map(item => (
          <tr key={item.id} onClick={() => onRowClick?.(item)}>
            {columns.map(col => (
              <td key={String(col.key)}>
                {col.render ? col.render(item[col.key], item) : String(item[col.key])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

### Usar en diferentes contextos

```typescript
// Tabla de usuarios
<DataTable<User>
  data={users}
  columns={[
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Rol' },
  ]}
  onRowClick={handleUserClick}
/>

// Tabla de encuestas
<DataTable<Survey>
  data={surveys}
  columns={[
    { key: 'title', label: 'Título' },
    { key: 'status', label: 'Estado' },
    {
      key: 'date',
      label: 'Fecha',
      render: (value) => new Date(value as string).toLocaleDateString(),
    },
  ]}
/>
```

---

## 5. Testing

### Test de Servicio

**`src/services/__tests__/auth.service.test.ts`**:
```typescript
import { authService } from '../auth.service'
import * as apiService from '../api.service'
import * as storageService from '../storage.service'

jest.mock('../api.service')
jest.mock('../storage.service')

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('login should persist user and token', async () => {
    const mockUser = { id: '1', email: 'test@test.com', role: 'admin' }
    const mockResponse = { token: 'abc123', user: mockUser }

    ;(apiService.apiService.login as jest.Mock).mockResolvedValue(mockResponse)

    await authService.login({ email: 'test@test.com', password: '123456' })

    expect(storageService.storageService.setUser).toHaveBeenCalledWith(mockUser)
    expect(storageService.storageService.setToken).toHaveBeenCalledWith('abc123')
  })

  test('logout should clear storage', async () => {
    await authService.logout()

    expect(storageService.storageService.clear).toHaveBeenCalled()
  })
})
```

### Test de Componente

**`src/components/__tests__/FeatureCard.test.tsx`**:
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { FeatureCard } from '../FeatureCard'

describe('FeatureCard', () => {
  test('should render with props', () => {
    render(
      <FeatureCard
        title="Test Title"
        description="Test Description"
        buttonLabel="Click Me"
      />,
    )

    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
    expect(screen.getByText('Click Me')).toBeInTheDocument()
  })

  test('should call onButtonClick when button is clicked', () => {
    const onClick = jest.fn()

    render(
      <FeatureCard
        title="Test"
        description="Test"
        buttonLabel="Click"
        onButtonClick={onClick}
      />,
    )

    fireEvent.click(screen.getByText('Click'))

    expect(onClick).toHaveBeenCalled()
  })

  test('should apply admin variant class', () => {
    const { container } = render(
      <FeatureCard
        title="Test"
        description="Test"
        buttonLabel="Click"
        variant="admin"
      />,
    )

    expect(container.querySelector('.admin-card')).toBeInTheDocument()
  })
})
```

---

## 6. Manejo de Errores Avanzado

### Servicio con manejo exhaustivo de errores

```typescript
interface ApiErrorResponse {
  error: {
    code: string
    message: string
    details?: unknown
  }
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(url, { ...options, headers })

      if (!response.ok) {
        const errorData = (await response.json()) as ApiErrorResponse

        throw {
          message: errorData.error.message,
          code: errorData.error.code,
          details: errorData.error.details,
        }
      }

      return await response.json()
    } catch (error) {
      // Re-throw con context
      throw this.handleError(error)
    }
  }

  private handleError(error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes('Network')) {
        return { message: 'Error de conexión', code: 'NETWORK_ERROR' }
      }
      if (error.message.includes('JSON')) {
        return { message: 'Respuesta inválida del servidor', code: 'PARSE_ERROR' }
      }
    }

    return { message: 'Error desconocido', code: 'UNKNOWN_ERROR' }
  }
}
```

---

## Resumen

Estos ejemplos demuestran cómo:
- ✅ Agregar nuevas funcionalidades sin tocar código existente
- ✅ Mantener la separación de responsabilidades
- ✅ Reutilizar componentes y servicios
- ✅ Escribir código testeable
- ✅ Manejar errores de forma centralizada

**Beneficio**: El código crece de forma sostenible y controlada.
