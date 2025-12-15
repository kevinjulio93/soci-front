/**
 * Router Configuration
 * Rutas de la aplicación con protección de permisos
 */

import { createBrowserRouter } from 'react-router-dom'
import Login from '../pages/Login'
import SociologistDashboard from '../pages/SociologistDashboard'
import AdminDashboard from '../pages/AdminDashboard'
import SurveyParticipant from '../pages/SurveyParticipant'
import { SocializerManagement } from '../pages/SocializerManagement'
import { ProtectedRoute } from '../components'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/sociologist/dashboard',
    element: (
      <ProtectedRoute requireSocializerRole>
        <SociologistDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/dashboard',
    element: (
      <ProtectedRoute allowedSubjects={['admin']} requireAdminRole>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/socializers',
    element: (
      <ProtectedRoute allowedSubjects={['admin']} requireAdminRole>
        <SocializerManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: '/survey/:surveyId/participant',
    element: (
      <ProtectedRoute requireSocializerRole>
        <SurveyParticipant />
      </ProtectedRoute>
    ),
  },
])
