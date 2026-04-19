import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import ScrollProgress from './components/ScrollProgress'
import CursorGlow from './components/CursorGlow'
import Navbar from './components/Navbar'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import DashboardLayout from './layouts/DashboardLayout'
import DashboardPage from './pages/DashboardPage'
import EmailPage from './pages/EmailPage'
import CalendarPage from './pages/CalendarPage'
import HabitsPage from './pages/HabitsPage'
import TasksPage from './pages/TasksPage'
import DocsPage from './pages/DocsPage'
import FinancePage from './pages/FinancePage'
import ComposePage from './pages/ComposePage'
import LocationPage from './pages/LocationPage'
import ReviewPage from './pages/ReviewPage'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-white/50">Loading Auth...</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ background: '#000000', minHeight: '100vh' }}>
        <ScrollProgress />
        <CursorGlow />
        
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<><Navbar /><LandingPage /></>} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected dashboard routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardPage />} />
            <Route path="email" element={<EmailPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="habits" element={<HabitsPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="docs" element={<DocsPage />} />
            <Route path="finance" element={<FinancePage />} />
            <Route path="compose" element={<ComposePage />} />
            <Route path="location" element={<LocationPage />} />
            <Route path="review" element={<ReviewPage />} />
          </Route>
          
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
