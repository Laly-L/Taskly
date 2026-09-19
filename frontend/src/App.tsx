import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import TasksPage from './pages/TasksPage'
import CategoriesPage from './pages/CategoriesPage'
import CalendarPage from './pages/CalendarPage'
import MyDayPage from './pages/MyDayPage'
import SettingsPage from './pages/SettingsPage'
import AppLayout from './components/AppLayout'

type Page = 'dashboard' | 'tasks' | 'calendar' | 'myday' | 'categories' | 'settings'

function AppInner() {
  const { user, isLoading } = useAuth()
  const [page, setPage] = useState<Page>('dashboard')

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <AuthPage />

  return (
    <AppLayout currentPage={page} onNavigate={setPage}>
      {page === 'dashboard' && <DashboardPage />}
      {page === 'tasks' && <TasksPage />}
      {page === 'calendar' && <CalendarPage />}
      {page === 'myday' && <MyDayPage />}
      {page === 'categories' && <CategoriesPage />}
      {page === 'settings' && <SettingsPage />}
    </AppLayout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
