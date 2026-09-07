import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { DashboardHome } from './pages/dashboard/DashboardHome'
import { ProjectsPage } from './pages/dashboard/projects/ProjectsPage'
import { ProfilePage } from './pages/dashboard/ProfilePage'
import { CreateProjectPage } from './pages/dashboard/projects/CreateProjectPage'
import { EditProjectPage } from './pages/dashboard/projects/EditProjectPage'
import { ProjectDetailPage } from './pages/dashboard/projects/ProjectDetailPage'
import { AdminDashboardPage } from './pages/dashboard/AdminDashboardPage'
import { ResourcesPage } from './pages/dashboard/resources/ResourcesPage'
import { CreateResourcePage } from './pages/dashboard/resources/CreateResourcePage'
import { EditResourcePage } from './pages/dashboard/resources/EditResourcePage'
import { PublicationsPage } from './pages/dashboard/publications/PublicationsPage'
import { CreatePublicationPage } from './pages/dashboard/publications/CreatePublicationPage'
import { EditPublicationPage } from './pages/dashboard/publications/EditPublicationPage'
import { ActivitiesPage } from './pages/dashboard/activities/ActivitiesPage'
import { CreateActivityPage } from './pages/dashboard/activities/CreateActivityPage'
import { EditActivityPage } from './pages/dashboard/activities/EditActivityPage'
import { ProfessorProfilePage } from './pages/public/ProfessorProfilePage'
import { HomePage } from './pages/public/HomePage'
import { AboutPage } from './pages/public/AboutPage'
import { ProjectsCatalogPage } from './pages/public/ProjectsCatalogPage'
import { PublicProjectDetailPage } from './pages/public/PublicProjectDetailPage'
import { PublicationsCatalogPage } from './pages/public/PublicationsCatalogPage'
import { PublicPublicationDetailPage } from './pages/public/PublicPublicationDetailPage'
import { LoginPage } from './pages/auth/LoginPage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage'
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
             <Route path="/publicaciones" element={<PublicationsCatalogPage />} />
             <Route path="/publicaciones/:id" element={<PublicPublicationDetailPage />} />
             <Route path="/profesor/:id" element={<ProfessorProfilePage />} />
             
            {/* Auth routes - only for non-authenticated users */}
            <Route path="/login" element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            } />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            
            {/* Dashboard routes - protected */}
             <Route path="/dashboard" element={
               <ProtectedRoute>
                 <DashboardLayout />
               </ProtectedRoute>
             }>
               <Route index element={<DashboardHome />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="profile" element={<ProfilePage />} />
               <Route path="resources" element={<ResourcesPage />} />
               <Route path="publications" element={<PublicationsPage />} />
               <Route path="activities" element={<ActivitiesPage />} />
               <Route 
                path="projects/new" 
                element={
                  <ProtectedRoute requiredPermissions={['create_project']}>
                    <CreateProjectPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="resources/new" 
                element={
                  <ProtectedRoute requiredPermissions={['create_resource']}>
                    <CreateResourcePage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="publications/new" 
                element={
                  <ProtectedRoute requiredPermissions={['create_publication']}>
                    <CreatePublicationPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="activities/new" 
                element={
                  <ProtectedRoute requiredPermissions={['create_activity']}>
                    <CreateActivityPage />
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
              <Route 
                path="resources/:id/edit" 
                element={
                  <ProtectedRoute requiredPermissions={['edit_own_resource']}>
                    <EditResourcePage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="publications/:id/edit" 
                element={
                  <ProtectedRoute requiredPermissions={['edit_own_publication']}>
                    <EditPublicationPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="activities/:id/edit" 
                element={
                  <ProtectedRoute requiredPermissions={['edit_own_activity']}>
                    <EditActivityPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="admin" 
                element={
                  <ProtectedRoute requiredPermissions={['manage_all_projects']}>
                    <AdminDashboardPage />
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