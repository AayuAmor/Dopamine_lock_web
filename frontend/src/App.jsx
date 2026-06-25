import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components'
import {
  AchievementsPage,
  ActiveMissionPage,
  AnalyticsPage,
  BlockManagerPage,
  BrowserExtensionPage,
  DashboardPage,
  DisciplineScorePage,
  GoalsHubPage,
  HelpPage,
  IdentityPage,
  LoginPage,
  MissionCenterPage,
  MonthlyReviewPage,
  RegisterPage,
  SessionHistoryPage,
  SettingsPage,
  SplashPage,
  StreakCalendarPage,
  WeeklyReviewPage,
} from './pages'
import './App.css'

const dashboardRoutes = [
  { path: '/dashboard', element: <DashboardPage /> },
  { path: '/mission-center', element: <MissionCenterPage /> },
  { path: '/active-mission', element: <ActiveMissionPage /> },
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
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SplashPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {dashboardRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={<AppLayout>{route.element}</AppLayout>}
          />
        ))}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
