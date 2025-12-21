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
import SurveysList from '../pages/SurveysList'
import Reports from '../pages/Reports'
import ReportsRealtime from '../pages/ReportsRealtime'
import ReportsGenerate from '../pages/ReportsGenerate'
import ReportsMap from '../pages/ReportsMap'
import { ProtectedRoute } from '../components'
import { ROUTES } from '../constants'

export const router = createBrowserRouter([
  {
    path: ROUTES.ROOT,
    element: <Login />,
  },
  {
    path: ROUTES.LOGIN,
    element: <Login />,
  },
  {
    path: ROUTES.DASHBOARD,
    element: (
      <ProtectedRoute requireSocializerRole>
        <SociologistDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.ADMIN_DASHBOARD,
    element: (
      <ProtectedRoute allowedSubjects={['admin']} requireAdminRole>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.ADMIN_SOCIALIZERS,
    element: (
      <ProtectedRoute allowedSubjects={['admin']} requireAdminRole>
        <SocializerManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.ADMIN_SOCIALIZERS_NEW,
    element: (
      <ProtectedRoute allowedSubjects={['admin']} requireAdminRole>
        <SocializerManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/socializers/edit/:id',
    element: (
      <ProtectedRoute allowedSubjects={['admin']} requireAdminRole>
        <SocializerManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.ADMIN_SURVEYS,
    element: (
      <ProtectedRoute allowedSubjects={['admin']} requireAdminRole>
        <SurveysList />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.ADMIN_REPORTS,
    element: (
      <ProtectedRoute allowedSubjects={['admin']} requireAdminRole>
        <Reports />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.ADMIN_REPORTS_REALTIME,
    element: (
      <ProtectedRoute allowedSubjects={['admin']} requireAdminRole>
        <ReportsRealtime />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.ADMIN_REPORTS_GENERATE,
    element: (
      <ProtectedRoute allowedSubjects={['admin']} requireAdminRole>
        <ReportsGenerate />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.ADMIN_REPORTS_MAP,
    element: (
      <ProtectedRoute allowedSubjects={['admin']} requireAdminRole>
        <ReportsMap />
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
