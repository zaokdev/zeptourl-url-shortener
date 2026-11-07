import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router'
import { FullPageSpinner } from '@/components/FullPageSpinner'
import Landing from '@/pages/Landing'
import NotFound from '@/pages/NotFound'

// Everything that needs Amplify loads on demand, so the landing page stays light.
const AuthLayout = lazy(() => import('./auth-layout'))
const ProtectedRoute = lazy(() => import('@/components/ProtectedRoute'))
const Login = lazy(() => import('@/pages/Login'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))

export function AppRoutes() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
