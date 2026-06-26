import { NavLink, useLocation } from 'react-router-dom'
import {
  Activity,
  BarChart3,
  Blocks,
  CalendarDays,
  ChevronRight,
  Clapperboard,
  Crosshair,
  Download,
  Flag,
  Gauge,
  Goal,
  History,
  Home,
  Medal,
  MonitorCheck,
  Settings,
  Shield,
  Target,
  Trophy,
  User,
  Video,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { getAssetUrl } from '../services/apiClient'

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: Home },
  { label: 'Mission Center', path: '/mission-center', icon: Target },
  { label: 'Active Mission', path: '/active-mission', icon: Crosshair },
  { label: 'Consumption Control', path: '/consumption-control', icon: Clapperboard },
  { label: 'Block Manager', path: '/block-manager', icon: Blocks },
  { label: 'Session History', path: '/session-history', icon: History },
  { label: 'Streak Calendar', path: '/streak-calendar', icon: CalendarDays },
  { label: 'Discipline Score', path: '/discipline-score', icon: Gauge },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Goals Hub', path: '/goals', icon: Goal },
  { label: 'Achievements', path: '/achievements', icon: Trophy },
  { label: 'Weekly Review', path: '/weekly-review', icon: Flag },
  { label: 'Monthly Review', path: '/monthly-review', icon: Activity },
  { label: 'Identity', path: '/identity', icon: User },
  { label: 'Browser Extension', path: '/browser-extension', icon: MonitorCheck },
  { label: 'Settings', path: '/settings', icon: Settings },
]

export function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="workspace">
        <Topbar />
        <main className="main-content">{children}</main>
      </div>
    </div>
  )
}

export function Sidebar() {
  const { user } = useAuth()

  return (
    <aside className="sidebar">
      <NavLink className="brand-lock" to="/dashboard">
        <Shield size={22} />
        <span>Dopamine Lock</span>
      </NavLink>
      {user && (
        <NavLink className="sidebar-profile" to="/profile">
          <UserAvatar user={user} size="sm" />
          <div>
            <strong>{user.fullName}</strong>
            <span>{user.disciplineTitle || 'DISCIPLINED BUILDER'}</span>
          </div>
        </NavLink>
      )}
      <nav className="nav-list" aria-label="Main navigation">
        {navItems.map(({ label, path, icon: Icon }) => (
          <NavLink key={path} className="nav-item" to={path}>
            <Icon size={17} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export function Topbar() {
  const location = useLocation()
  const current = navItems.find((item) => item.path === location.pathname)
  const title = current?.label || (location.pathname === '/profile' ? 'Profile' : 'Dopamine Lock')
  const { logout, user } = useAuth()

  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Control Center</p>
        <h1>{title}</h1>
      </div>
      <div className="topbar-status">
        {user && (
          <NavLink className="topbar-profile" to="/profile">
            <UserAvatar user={user} size="sm" />
            <span className="topbar-user">{user.fullName}</span>
          </NavLink>
        )}
        <Badge label="Strict Mode" />
        <Button variant="secondary" onClick={logout}>Logout</Button>
      </div>
    </header>
  )
}

export function UserAvatar({ user, size = 'md' }) {
  const initials = (user?.fullName || user?.email || 'DL')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  if (user?.avatarUrl) {
    return (
      <img
        className={`avatar avatar-${size}`}
        src={getAssetUrl(user.avatarUrl)}
        alt={`${user.fullName || 'User'} avatar`}
      />
    )
  }

  return <span className={`avatar avatar-${size}`}>{initials}</span>
}

export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <section className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </section>
  )
}

export function Card({ title, label, children, action, className = '' }) {
  return (
    <section className={`card ${className}`}>
      {(title || label || action) && (
        <div className="card-head">
          <div>
            {label && <p className="eyebrow">{label}</p>}
            {title && <h3>{title}</h3>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function StatCard({ label, value, meta, icon: Icon }) {
  return (
    <Card className="stat-card">
      <div className="stat-top">
        <p className="eyebrow">{label}</p>
        {Icon && <Icon size={18} />}
      </div>
      <strong>{value}</strong>
      {meta && <span>{meta}</span>}
    </Card>
  )
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  return (
    <button className={`button button-${variant} ${className}`} type="button" {...props}>
      {children}
    </button>
  )
}

export function Input({ label, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input {...props} />
    </label>
  )
}

export function Select({ label, children, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select {...props}>{children}</select>
    </label>
  )
}

export function Badge({ label, tone = 'default' }) {
  return <span className={`badge badge-${tone}`}>{label}</span>
}

export function ProgressBar({ value }) {
  return (
    <div className="progress" aria-label={`Progress ${value}%`}>
      <span style={{ width: `${value}%` }} />
    </div>
  )
}

export function MiniBarChart({ values }) {
  const max = Math.max(...values)
  return (
    <div className="mini-bars">
      {values.map((value, index) => (
        <span key={`${value}-${index}`} style={{ height: `${(value / max) * 100}%` }} />
      ))}
    </div>
  )
}

export function LineChartMock({ values }) {
  const points = values
    .map((value, index) => `${(index / (values.length - 1)) * 100},${100 - value}`)
    .join(' ')

  return (
    <svg className="line-chart" viewBox="0 0 100 100" preserveAspectRatio="none" role="img">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

export function CalendarGrid({ days }) {
  return (
    <div className="calendar-grid">
      {days.map((state, index) => (
        <span key={`${state}-${index}`} className={`day day-${state}`}>
          {index + 1}
        </span>
      ))}
    </div>
  )
}

export function SessionCard({ session }) {
  return (
    <article className="session-card">
      <div>
        <h4>{session.title}</h4>
        <p>{session.time}</p>
      </div>
      <div className="session-meta">
        <Badge label={session.status} tone={session.status === 'Failed' ? 'danger' : 'default'} />
        <span>{session.duration}</span>
        <strong>{session.xp} XP</strong>
      </div>
    </article>
  )
}

export function AchievementBadge({ achievement }) {
  return (
    <article className={`achievement achievement-${achievement.state.toLowerCase()}`}>
      <Medal size={22} />
      <h4>{achievement.title}</h4>
      <Badge label={achievement.state} tone={achievement.state === 'Locked' ? 'muted' : 'default'} />
      <ProgressBar value={achievement.progress} />
    </article>
  )
}

export function GoalCard({ goal }) {
  return (
    <Card title={goal.title} label={`${goal.missions} connected missions`}>
      <ProgressBar value={goal.progress} />
      <div className="card-row">
        <span>Progress</span>
        <strong>{goal.progress}%</strong>
      </div>
    </Card>
  )
}

export function PlatformUsageCard({ platform }) {
  const tone = platform.status === 'Limit Reached' ? 'danger' : platform.status === 'Warning' ? 'muted' : 'default'

  return (
    <article className="platform-card">
      <div className="platform-head">
        <div className="platform-icon">
          <Video size={20} />
        </div>
        <div>
          <p className="eyebrow">Platform usage</p>
          <h3>{platform.name}</h3>
        </div>
      </div>
      <div className="platform-stats">
        <span>{platform.videos} videos watched</span>
        <span>{platform.minutes} minutes spent</span>
        <span>Daily limit {platform.limit}</span>
      </div>
      <ProgressBar value={platform.progress} />
      <Badge label={platform.status} tone={tone} />
    </article>
  )
}

export function FutureFeatureCard({ title }) {
  return (
    <article className="future-card" aria-disabled="true">
      <Badge label="Coming Soon" tone="muted" />
      <h4>{title}</h4>
    </article>
  )
}

export function ReviewStatCard({ label, value }) {
  return (
    <div className="review-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export function ActionLink({ children, onClick }) {
  return (
    <Button variant="secondary" onClick={onClick}>
      {children}
      <ChevronRight size={15} />
    </Button>
  )
}

export function ExportButton({ children = 'Export Report' }) {
  return (
    <Button>
      <Download size={15} />
      {children}
    </Button>
  )
}
