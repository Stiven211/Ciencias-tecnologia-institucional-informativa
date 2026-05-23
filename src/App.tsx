import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { DashboardHome } from './pages/dashboard/DashboardHome'
import { ProjectsPage } from './pages/dashboard/projects/ProjectsPage'
import { CreateProjectPage } from './pages/dashboard/projects/CreateProjectPage'
import { EditProjectPage } from './pages/dashboard/projects/EditProjectPage'
import { ProjectDetailPage } from './pages/dashboard/projects/ProjectDetailPage'
import { HomePage } from './pages/public/HomePage'
import { AboutPage } from './pages/public/AboutPage'
import { ProjectsCatalogPage } from './pages/public/ProjectsCatalogPage'
import { PublicProjectDetailPage } from './pages/public/PublicProjectDetailPage'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { Navigate } from 'react-router-dom'
import { ToastProvider } from './components/ui/Toast'
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute'
import { AuthProvider } from './components/AuthProvider'

function App() {
  return (
    <ToastProvider>
      <Router>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/projects" element={<ProjectsCatalogPage />} />
            <Route path="/projects/:slug" element={<PublicProjectDetailPage />} />
            
            {/* Auth routes - only for non-authenticated users */}
            <Route path="/login" element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            } />
            <Route path="/register" element={
              <PublicOnlyRoute>
                <RegisterPage />
              </PublicOnlyRoute>
            } />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            
            {/* Dashboard routes - protected */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardHome />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route 
                path="projects/new" 
                element={
                  <ProtectedRoute requiredPermissions={['create_project']}>
                    <CreateProjectPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="projects/:id" 
                element={<ProjectDetailPage />} 
              />
              <Route 
                path="projects/:id/edit" 
                element={
                  <ProtectedRoute requiredPermissions={['edit_own_project']}>
                    <EditProjectPage />
                  </ProtectedRoute>
                } 
              />
            </Route>
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ToastProvider>
  )
}

export default App