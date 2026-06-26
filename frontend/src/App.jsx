import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components'
import { AuthProvider } from './context/AuthContext'
import {
  AchievementsPage,
  ActiveMissionPage,
  AnalyticsPage,
  BlockManagerPage,
  BrowserExtensionPage,
  ConsumptionControlPage,
  DashboardPage,
  DisciplineScorePage,
  GoalsHubPage,
  HelpPage,
  IdentityPage,
  LoginPage,
  MissionCenterPage,
  MonthlyReviewPage,
  ProfilePage,
  RegisterPage,
  SessionHistoryPage,
  SettingsPage,
  SplashPage,
  StreakCalendarPage,
  WeeklyReviewPage,
} from './pages'
import { ProtectedRoute, PublicOnlyRoute } from './routes/ProtectedRoute'
import './App.css'

const dashboardRoutes = [
  { path: '/dashboard', element: <DashboardPage /> },
  { path: '/profile', element: <ProfilePage /> },
  { path: '/mission-center', element: <MissionCenterPage /> },
  { path: '/active-mission', element: <ActiveMissionPage /> },
  { path: '/consumption-control', element: <ConsumptionControlPage /> },
  { path: '/block-manager', element: <BlockManagerPage /> },
  { path: '/session-history', element: <SessionHistoryPage /> },
  { path: '/streak-calendar', element: <StreakCalendarPage /> },
  { path: '/discipline-score', element: <DisciplineScorePage /> },
  { path: '/analytics', element: <AnalyticsPage /> },
  { path: '/achievements', element: <AchievementsPage /> },
  { path: '/goals', element: <GoalsHubPage /> },
  { path: '/weekly-review', element: <WeeklyReviewPage /> },
  { path: '/monthly-review', element: <MonthlyReviewPage /> },
  { path: '/identity', element: <IdentityPage /> },
  { path: '/browser-extension', element: <BrowserExtensionPage /> },
  { path: '/settings', element: <SettingsPage /> },
  { path: '/help', element: <HelpPage /> },
]

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SplashPage />} />
          <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
          <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
          {dashboardRoutes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={
                <ProtectedRoute>
                  <AppLayout>{route.element}</AppLayout>
                </ProtectedRoute>
              }
            />
          ))}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
