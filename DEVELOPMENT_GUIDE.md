# Guía de Desarrollo - Soci App Frontend

## Estructura del Proyecto Refactorizado

Este proyecto sigue arquitectura **SOLID** con separación clara de responsabilidades.

---

## 📁 Directorios Principales

### `/src/types`
**Propósito**: Definiciones centralizadas de tipos e interfaces

```typescript
// types/index.ts
export type UserRole = 'admin' | 'sociologist'
export interface User { ... }
export interface LoginCredentials { ... }
```

**Cuándo usarlo**: Siempre que necesites un tipo, búscalo aquí primero.

---

### `/src/services`
**Propósito**: Lógica de negocio y comunicación externa

#### `api.service.ts`
- Abstracción de llamadas HTTP
- Maneja requests/responses
- Manejo de errores centralizado
- **Nunca** debe conocer de React

```typescript
const response = await apiService.login(credentials);
```

#### `auth.service.ts`
- Orquestación de autenticación
- Compone `apiService` y `storageService`
- Encapsula la lógica de login/logout

```typescript
const user = await authService.login(credentials);
```

#### `storage.service.ts`
- Abstracción de localStorage
- Fácil de reemplazar por IndexedDB, AsyncStorage, etc.

```typescript
storageService.setUser(user);
storageService.getToken();
```

**Cuándo agregar un servicio**:
- Lógica reutilizable en múltiples componentes
- Comunicación con APIs externas
- Lógica compleja de negocio

---

### `/src/contexts`
**Propósito**: Estado global de React

#### `AuthContext.tsx`
- Proporciona estado de autenticación a toda la app
- Usa `authService` para lógica (separación)
- Solo maneja estado UI

```tsx
const { user, isAuthenticated, login, logout, isLoading, error } = useAuth();
```

**Regla**: El contexto **NUNCA** debe contener lógica de negocio compleja.

---

### `/src/components`
**Propósito**: Componentes presentacionales reutilizables

#### Principios
1. **Sin lógica**: Solo reciben datos por props
2. **Reutilizables**: Funcionan en múltiples lugares
3. **Testables**: Fácil crear unit tests
4. **Nombrados**: El nombre describe exactamente qué hacen

#### Ejemplos

```tsx
// ✅ BIEN: Componente simple, reutilizable
<FeatureCard
  title="Crear Encuesta"
  description="Crea una nueva encuesta..."
  buttonLabel="Crear"
  onButtonClick={handleCreate}
  variant="admin"
/>

// ✅ BIEN: Componente con lógica simple de presentación
<SurveyTable surveys={surveys} onViewDetails={handler} />

// ❌ MAL: Componente con lógica de negocio
<ComplexComponent>
  {/* Llamadas a API aquí */}
  {/* Validaciones aquí */}
</ComplexComponent>
```

**Barrel Export** (`index.ts`):
```typescript
export { ProtectedRoute } from './ProtectedRoute'
export { LoginForm } from './LoginForm'
// Facilita importaciones
```

---

### `/src/pages`
**Propósito**: Página entera que coordina componentes

```tsx
export default function SociologistDashboard() {
  const { user, logout } = useAuth();
  const [surveys, setSurveys] = useState<Survey[]>([]);

  // Coordina componentes
  return (
    <DashboardHeader title="Dashboard" user={user} onLogout={handleLogout} />
    <SurveyTable surveys={surveys} onViewDetails={handler} />
    <FeatureCard ... />
  );
}
```

---

### `/src/routes`
**Propósito**: Configuración de rutas

```typescript
// Con protección por roles
<ProtectedRoute allowedRoles={['admin']}>
  <AdminDashboard />
</ProtectedRoute>
```

---

### `/src/styles`
**Propósito**: Estilos globales y variables

#### Variables (`_variables.scss`)
```scss
$color-primary: #ffed4e;      // Amarillo
$color-secondary: #4a7c6f;    // Verde
$color-tertiary: #2d4a5f;     // Azul oscuro
$spacing-lg: 1.5rem;
$font-size-lg: 1.125rem;
```

**Cuándo agregar variables**:
- Valores que se repiten
- Configuración visual centralizada

---

## 🔄 Flujo de Datos

### Autenticación

```
Login Page
  ↓
LoginForm (presentacional)
  ↓
useAuth() → authService.login()
  ↓
  ├─ apiService.login() → HTTP POST
  ├─ storageService.setUser() → localStorage
  └─ storageService.setToken() → localStorage
  ↓
AuthContext actualiza estado
  ↓
Router redirige según user.role
```

### Acceso a Datos en Componentes

```tsx
function MyComponent() {
  // Acceder a auth state
  const { user, isAuthenticated } = useAuth();

  // Llamar a servicio (para datos, no state)
  const [surveys, setSurveys] = useState<Survey[]>([]);
  
  useEffect(() => {
    // Llamar servicio cuando sea necesario
    surveyService.getSurveys().then(setSurveys);
  }, []);

  // Renderizar componentes presentacionales
  return <SurveyTable surveys={surveys} />;
}
```

---

## ✅ Checklist para Nuevas Funcionalidades

### 1. Agregar un nuevo tipo/interfaz
- [ ] Crear en `/src/types/index.ts`
- [ ] Usar `type` para tipos puros, `interface` para objetos

### 2. Crear un nuevo servicio
- [ ] Crear en `/src/services/nuevo.service.ts`
- [ ] Sin importes de React
- [ ] Exportar instancia singleton
- [ ] Manejo de errores centralizado

```typescript
class NuevoService {
  async getData(): Promise<Data[]> { ... }
}
export const nuevoService = new NuevoService();
```

### 3. Crear un componente presentacional
- [ ] Crear en `/src/components/NuevoComponent.tsx`
- [ ] Solo props, sin hooks complejos
- [ ] Tipos en el mismo archivo
- [ ] Agregar al barrel export `index.ts`

```tsx
interface NuevoComponentProps { ... }
export function NuevoComponent(props: NuevoComponentProps) { ... }
```

### 4. Crear una página
- [ ] Crear en `/src/pages/NuevaPage.tsx`
- [ ] Puede usar hooks (`useAuth`, `useEffect`)
- [ ] Coordina componentes
- [ ] Llama servicios si es necesario

### 5. Agregar ruta protegida
- [ ] Editar `/src/routes/index.tsx`
- [ ] Usar `ProtectedRoute` con roles

---

## 🧪 Testing

### Servicios (Fáciles de testear)

```typescript
test('authService.login should persist user', async () => {
  const user = await authService.login(credentials);
  expect(storageService.getUser()).toEqual(user);
});
```

### Componentes (Props claros)

```typescript
test('FeatureCard should call onButtonClick', () => {
  const onClick = jest.fn();
  render(
    <FeatureCard
      title="Test"
      buttonLabel="Click"
      onButtonClick={onClick}
    />
  );
  fireEvent.click(screen.getByText('Click'));
  expect(onClick).toHaveBeenCalled();
});
```

---

## ⚠️ Antipatrones a Evitar

❌ **NO HAGAS ESTO:**

```tsx
// ❌ Lógica en componentes
function BadComponent() {
  const [user, setUser] = useState();
  useEffect(() => {
    fetch('/api/user').then(setUser);
  }, []);
}

// ❌ Componentes que hacen demasiado
function MegaComponent() {
  // Validaciones, HTTP, estado global, estilos...
}

// ❌ Importes circulares
// service A → service B → service A

// ❌ Servicios que importan React
import React from 'react';
class BadService { ... }

// ❌ Props gigantes
<Component a={a} b={b} c={c} d={d} e={e} ... />
```

---

## 🚀 Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Preview de build
npm run preview

# Linting
npm run lint

# Type checking
npx tsc --noEmit

# Format
npx prettier --write src/
```

---

## 📚 Recursos

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Docs](https://react.dev)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [12factor App](https://12factor.net/)

---

## 💬 Convenciones de Código

### Nombres

```typescript
// ✅ BIEN: Claro y descriptivo
const userEmail = 'user@example.com';
function handleLoginClick() { ... }
const isAuthenticated = true;

// ❌ MAL: Ambiguo
const e = 'user@example.com';
const handle = () => { ... };
const ok = true;
```

### Imports

```typescript
// ✅ BIEN: Ordenados
import { ReactNode } from 'react';
import type { User, Survey } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth.service';
import '../styles/Dashboard.scss';

// ❌ MAL: Desordenados
import type { User } from '../types';
import { authService } from '../services/auth.service';
import '../styles/Dashboard.scss';
import { useAuth } from '../contexts/AuthContext';
```

---

## 🎯 Conclusión

Este proyecto está diseñado para ser:

- **Escalable**: Fácil agregar nuevas funcionalidades
- **Mantenible**: Código limpio y bien organizado
- **Testeable**: Cada parte es independiente
- **Profesional**: Sigue estándares de la industria

¡Disfruta desarrollando! 🚀
