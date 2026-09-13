import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import { PERMISSIONS } from './auth/permissions'

// Pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ClubsPage from './pages/ClubsPage'
import ClubMembersPage from './pages/ClubMembersPage'
import ActivityAttendancePage from './pages/ActivityAttendancePage'
import ReportsPage from './pages/ReportsPage'
import CreateReportPage from './pages/CreateReportPage'
import ReportDetailPage from './pages/ReportDetailPage'
import KpiPage from './pages/KpiPage'
import ActivitiesPage from './pages/ActivitiesPage'
import FinancePage from './pages/FinancePage'
import NotificationsPage from './pages/NotificationsPage'
import ProfilePage from './pages/ProfilePage'
import UsersPage from './pages/UsersPage'

// Protected Route Component
function ProtectedRoute({ children, permission }) {
  const { isAuthenticated, loading, hasPermission } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-cyber-dark flex items-center justify-center">
        <div className="text-center">
          <div className="cyber-spinner mx-auto mb-4" />
          <p className="font-orbitron text-cyan-400 animate-pulse">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

// Route with Layout
function LayoutRoute({ children, title, permission }) {
  return (
    <ProtectedRoute permission={permission}>
      <Layout title={title}>
        {children}
      </Layout>
    </ProtectedRoute>
  )
}

// Auth Route (redirect if already logged in)
function AuthRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-cyber-dark flex items-center justify-center">
        <div className="cyber-spinner mx-auto" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default function App() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route
        path="/login"
        element={
          <AuthRoute>
            <LoginPage />
          </AuthRoute>
        }
      />
      <Route
        path="/register"
        element={
          <AuthRoute>
            <RegisterPage />
          </AuthRoute>
        }
      />

      {/* Protected Routes with Layout */}
      <Route
        path="/dashboard"
        element={
          <LayoutRoute title="Tổng quan" permission={PERMISSIONS.VIEW_DASHBOARD}>
            <DashboardPage />
          </LayoutRoute>
        }
      />
      <Route
        path="/clubs"
        element={
          <LayoutRoute title="Câu lạc bộ" permission={PERMISSIONS.VIEW_CLUBS}>
            <ClubsPage />
          </LayoutRoute>
        }
      />
      <Route
        path="/clubs/:clubId/members"
        element={
          <LayoutRoute title="Thành viên câu lạc bộ" permission={PERMISSIONS.VIEW_CLUBS}>
            <ClubMembersPage />
          </LayoutRoute>
        }
      />
      <Route
        path="/clubs/:clubId/attendance"
        element={
          <LayoutRoute title="Điểm danh hoạt động" permission={PERMISSIONS.VIEW_ACTIVITIES}>
            <ActivityAttendancePage />
          </LayoutRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <LayoutRoute title="Báo cáo" permission={PERMISSIONS.VIEW_REPORTS}>
            <ReportsPage />
          </LayoutRoute>
        }
      />
      <Route
        path="/reports/create"
        element={
          <LayoutRoute title="Tạo báo cáo" permission={PERMISSIONS.AUTHOR_REPORTS}>
            <CreateReportPage />
          </LayoutRoute>
        }
      />
      <Route
        path="/reports/:id"
        element={
          <LayoutRoute title="Chi tiết báo cáo" permission={PERMISSIONS.VIEW_REPORTS}>
            <ReportDetailPage />
          </LayoutRoute>
        }
      />
      <Route
        path="/reports/:id/edit"
        element={
          <LayoutRoute title="Chỉnh sửa báo cáo" permission={PERMISSIONS.AUTHOR_REPORTS}>
            <CreateReportPage />
          </LayoutRoute>
        }
      />
      <Route
        path="/kpi"
        element={
          <LayoutRoute title="KPI" permission={PERMISSIONS.VIEW_KPI}>
            <KpiPage />
          </LayoutRoute>
        }
      />
      <Route
        path="/activities"
        element={
          <LayoutRoute title="Hoạt động" permission={PERMISSIONS.VIEW_ACTIVITIES}>
            <ActivitiesPage />
          </LayoutRoute>
        }
      />
      <Route
        path="/finance"
        element={
          <LayoutRoute title="Tài chính" permission={PERMISSIONS.VIEW_FINANCE}>
            <FinancePage />
          </LayoutRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <LayoutRoute title="Thông báo" permission={PERMISSIONS.VIEW_NOTIFICATIONS}>
            <NotificationsPage />
          </LayoutRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <LayoutRoute title="Hồ sơ" permission={PERMISSIONS.VIEW_PROFILE}>
            <ProfilePage />
          </LayoutRoute>
        }
      />
      <Route
        path="/users"
        element={
          <LayoutRoute title="Người dùng" permission={PERMISSIONS.MANAGE_USERS}>
            <UsersPage />
          </LayoutRoute>
        }
      />

      {/* Default Redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
