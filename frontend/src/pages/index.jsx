import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity,
  Ban,
  BookOpen,
  CheckCircle2,
  Code2,
  Clock,
  Flame,
  Gauge,
  Lock,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Smartphone,
  Target,
  TimerReset,
  Trophy,
} from 'lucide-react'
import {
  AchievementBadge,
  ActionLink,
  Badge,
  Button,
  CalendarGrid,
  Card,
  ExportButton,
  FutureFeatureCard,
  GoalCard,
  Input,
  LineChartMock,
  MiniBarChart,
  PageHeader,
  PlatformUsageCard,
  ProgressBar,
  ReviewStatCard,
  Select,
  SessionCard,
  StatCard,
} from '../components'
import { useAuth } from '../context/useAuth'
import {
  achievements,
  allowedWebsites,
  analytics,
  blockedWebsites,
  consumptionControl,
  disciplineScore,
  futureFeatures,
  goals,
  missions,
  monthlyReview,
  sessions,
  streakDays,
  weeklyReview,
} from '../data/mockData'

const missionRules = ['Strict mode', 'Block all notifications', 'Prevent tab switching']
const categories = ['Social', 'Video', 'Forums', 'News', 'Gaming', 'Shopping']
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateAuthFields(fields, requireName = false) {
  if (requireName && !fields.fullName.trim()) {
    return 'Full name is required'
  }

  if (!fields.email.trim() || !fields.password) {
    return 'Email and password are required'
  }

  if (!emailPattern.test(fields.email.trim())) {
    return 'Enter a valid email address'
  }

  if (fields.password.length < 6) {
    return 'Password must be at least 6 characters'
  }

  if (requireName && fields.password !== fields.confirmPassword) {
    return 'Passwords do not match'
  }

  return ''
}

export function SplashPage() {
  return (
    <main className="splash-screen">
      <div className="molecule" aria-hidden="true">
        <span className="node node-a" />
        <span className="node node-b" />
        <span className="node node-c" />
        <span className="node node-d" />
        <span className="bond bond-a" />
        <span className="bond bond-b" />
        <span className="bond bond-c" />
      </div>
      <p className="eyebrow">Dopamine - The chemical of reward</p>
      <h1>Dopamine</h1>
      <p className="splash-copy">
        Reward is useful only when it obeys direction. Lock the impulse. Finish the mission.
        Build the identity.
      </p>
      <div className="splash-actions">
        <Link className="button button-primary" to="/dashboard">Enter Dopamine Lock</Link>
        <Link className="button button-secondary" to="/login">Login</Link>
      </div>
    </main>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validationError = validateAuthFields(form)

    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setError('')
      setIsSubmitting(true)
      await login({ email: form.email, password: form.password })
      navigate('/dashboard', { replace: true })
    } catch (authError) {
      setError(authError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell title="Login" subtitle="Return to the operating system." onSubmit={handleSubmit}>
      {error && <p className="form-error">{error}</p>}
      <Input label="Email" type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} placeholder="operator@dopaminelock.app" />
      <Input label="Password" type="password" value={form.password} onChange={(event) => updateField('password', event.target.value)} placeholder="Password" />
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Logging In' : 'Login'}</Button>
      <div className="auth-links">
        <Link to="/login">Forgot password</Link>
        <Link to="/register">Sign up</Link>
      </div>
    </AuthShell>
  )
}

export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validationError = validateAuthFields(form, true)

    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setError('')
      setIsSubmitting(true)
      await register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
      })
      navigate('/dashboard', { replace: true })
    } catch (authError) {
      setError(authError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell title="Create Account" subtitle="Build a disciplined control profile." onSubmit={handleSubmit}>
      {error && <p className="form-error">{error}</p>}
      <Input label="Full name" value={form.fullName} onChange={(event) => updateField('fullName', event.target.value)} placeholder="Full name" />
      <Input label="Email" type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} placeholder="operator@dopaminelock.app" />
      <Input label="Password" type="password" value={form.password} onChange={(event) => updateField('password', event.target.value)} placeholder="Password" />
      <Input label="Confirm password" type="password" value={form.confirmPassword} onChange={(event) => updateField('confirmPassword', event.target.value)} placeholder="Confirm password" />
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating Account' : 'Create Account'}</Button>
      <div className="auth-links">
        <Link to="/login">Login</Link>
      </div>
    </AuthShell>
  )
}

function AuthShell({ title, subtitle, children, onSubmit }) {
  return (
    <main className="auth-screen">
      <Link className="brand-lock auth-brand" to="/">Dopamine Lock</Link>
      <form className="auth-card" onSubmit={onSubmit}>
        <p className="eyebrow">Access</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        <div className="form-stack">{children}</div>
      </form>
    </main>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <>
      <PageHeader
        eyebrow="Daily Command"
        title="Discipline Dashboard"
        description={`Welcome back, ${user?.fullName || 'Operator'}. Track the mission, protect attention, and keep the streak intact.`}
      />
      <div className="stats-grid">
        <StatCard label="Current Mission" value="68%" meta="Deep Work: DSA Blocks" icon={Target} />
        <StatCard label="Discipline Score" value={disciplineScore.score} meta={disciplineScore.rank} icon={Gauge} />
        <StatCard label="Current Streak" value="12 days" meta="Best streak: 21" icon={Flame} />
        <StatCard label="Today's Focus" value="3.4h" meta="Daily goal: 4h" icon={Clock} />
      </div>
      <div className="content-grid two-one">
        <Card title="Weekly Focus Chart" label="Hours locked">
          <MiniBarChart values={analytics.focusHours} />
        </Card>
        <Card title="Quick Actions" label="Next command">
          <div className="button-stack">
            <ActionLink onClick={() => navigate('/mission-center')}>Create Mission</ActionLink>
            <ActionLink onClick={() => navigate('/active-mission')}>Resume Active Mission</ActionLink>
            <ActionLink onClick={() => navigate('/block-manager')}>Update Blocks</ActionLink>
          </div>
        </Card>
      </div>
      <Card
        title="Consumption Overview"
        label="Create more, consume less"
        action={<Button variant="secondary" onClick={() => navigate('/consumption-control')}>Manage Consumption</Button>}
      >
        <div className="review-grid compact-review">
          <ReviewStatCard label="Today's Reels" value={consumptionControl.today.reels} />
          <ReviewStatCard label="Today's Shorts" value={consumptionControl.today.shorts} />
          <ReviewStatCard label="Time Consumed" value={consumptionControl.today.timeConsumed} />
          <ReviewStatCard label="Healthy Consumption" value={`${consumptionControl.today.healthyPercent}%`} />
        </div>
      </Card>
      <Card title="Recent Sessions" label="Last activity">
        <div className="list-stack">{sessions.slice(0, 3).map((session) => <SessionCard key={session.id} session={session} />)}</div>
      </Card>
    </>
  )
}

export function MissionCenterPage() {
  return (
    <>
      <PageHeader eyebrow="Mission Center" title="Create Focus Mission" description="Define the objective, constraints, and resistance protocol." />
      <div className="content-grid split">
        <Card title="Create Mission Form" label="Mission design">
          <div className="form-grid">
            <Input label="Mission name" placeholder="Deep Work: DSA Blocks" />
            <Input label="Goal" placeholder="Complete graph traversal drills" />
            <Input label="Duration" placeholder="90 minutes" />
            <Select label="Difficulty" defaultValue="Hard">
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </Select>
            <Input label="Blocked websites" placeholder="youtube.com, x.com" />
            <Input label="Allowed websites" placeholder="leetcode.com, github.com" />
          </div>
          <div className="toggle-list">{missionRules.map((rule) => <label key={rule}><input type="checkbox" defaultChecked /> {rule}</label>)}</div>
          <Button><Plus size={15} />Create Mission</Button>
        </Card>
        <Card title="Mission Templates" label="Fast start">
          <div className="list-stack">
            {missions.map((mission) => (
              <div className="compact-row" key={mission.id}>
                <div><strong>{mission.name}</strong><span>{mission.goal}</span></div>
                <Badge label={mission.difficulty} />
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card title="Mission Rules" label="Default protection">
        <div className="badge-row">{missionRules.map((rule) => <Badge key={rule} label={rule} />)}</div>
      </Card>
    </>
  )
}

export function ActiveMissionPage() {
  return (
    <>
      <PageHeader eyebrow="Active Mission" title="Deep Work: DSA Blocks" description="Complete graph traversal drills before reward access." />
      <Card className="mission-hero">
        <p className="eyebrow">Mission Timer</p>
        <strong>00:42:18</strong>
        <span>48 minutes remaining</span>
        <ProgressBar value={68} />
      </Card>
      <div className="stats-grid">
        <StatCard label="Focus Score" value="91" meta="Stable" icon={Gauge} />
        <StatCard label="Distractions Prevented" value="37" meta="This mission" icon={Ban} />
        <StatCard label="Blocked Categories" value="6" meta="Social, video, forums" icon={Lock} />
      </div>
      <div className="content-grid split">
        <Card title="Mission Rules" label="Enforced">
          <div className="list-stack">{missionRules.map((rule) => <div className="compact-row" key={rule}><span>{rule}</span><Badge label="On" /></div>)}</div>
        </Card>
        <Card title="Blocked Websites" label="Impulse perimeter">
          <div className="badge-row">{blockedWebsites.map((item) => <Badge key={item.id} label={item.site} />)}</div>
        </Card>
      </div>
      <Button variant="danger">End Mission</Button>
    </>
  )
}

export function ConsumptionControlPage() {
  const navigate = useNavigate()
  const [limits, setLimits] = useState(consumptionControl.limits)
  const [strictMode, setStrictMode] = useState(true)
  const [threshold, setThreshold] = useState('90')
  const timelineValues = consumptionControl.timeline.map((item) => item.total)

  const updateLimit = (key, value) => {
    setLimits((current) => ({ ...current, [key]: value }))
  }

  return (
    <>
      <section className="consumption-hero">
        <div>
          <p className="eyebrow">Consumption Control</p>
          <h2>Consumption Control</h2>
          <p>Track, understand, and limit short-form content before it controls your attention.</p>
        </div>
        <Card className="daily-score-card">
          <p className="eyebrow">Daily Consumption Score</p>
          <strong>{consumptionControl.score} / 100</strong>
          <Badge label={consumptionControl.status} />
        </Card>
      </section>

      <div className="stats-grid">
        <StatCard label="Today's Reels" value={consumptionControl.today.reels} icon={Smartphone} />
        <StatCard label="Today's Shorts" value={consumptionControl.today.shorts} icon={TimerReset} />
        <StatCard label="Time Consumed" value={consumptionControl.today.timeConsumed} icon={Clock} />
        <StatCard label="Daily Limit Remaining" value={consumptionControl.today.limitRemaining} icon={ShieldCheck} />
      </div>

      <section className="panel-section">
        <div className="card-head">
          <div>
            <p className="eyebrow">Short-form sources</p>
            <h3>Platform Usage</h3>
          </div>
        </div>
        <div className="platform-grid">
          {consumptionControl.platforms.map((platform) => (
            <PlatformUsageCard key={platform.id} platform={platform} />
          ))}
        </div>
      </section>

      <div className="content-grid split">
        <Card title="Consumption Timeline" label="Last 7 days">
          <LineChartMock values={timelineValues} />
          <div className="chart-labels">
            {consumptionControl.timeline.map((item) => (
              <span key={item.day}>{item.day.slice(0, 3)}</span>
            ))}
          </div>
        </Card>
        <Card title="Daily Limit Manager" label="Frontend controls">
          <div className="form-grid">
            <Input label="Maximum reels per day" type="number" value={limits.reels} onChange={(event) => updateLimit('reels', event.target.value)} />
            <Input label="Maximum shorts per day" type="number" value={limits.shorts} onChange={(event) => updateLimit('shorts', event.target.value)} />
            <Input label="Maximum TikTok videos" type="number" value={limits.tiktok} onChange={(event) => updateLimit('tiktok', event.target.value)} />
            <Input label="Maximum total watch time" type="number" value={limits.watchTime} onChange={(event) => updateLimit('watchTime', event.target.value)} />
          </div>
          <label className="compact-row strict-toggle">
            <span>Strict Lock Mode</span>
            <input type="checkbox" checked={strictMode} onChange={(event) => setStrictMode(event.target.checked)} />
          </label>
          {strictMode && (
            <p className="muted-text">When your limit is reached, Dopamine Lock blocks further access until tomorrow.</p>
          )}
        </Card>
      </div>

      <div className="content-grid split">
        <Card title="Warning Threshold" label="Limit alerts">
          <Select label="Choose threshold" value={threshold} onChange={(event) => setThreshold(event.target.value)}>
            <option value="50">50%</option>
            <option value="75">75%</option>
            <option value="90">90%</option>
            <option value="100">100%</option>
          </Select>
          <p className="warning-preview">You have consumed {threshold}% of today's reel limit.</p>
        </Card>
        <Card title="Weekly Analytics" label="Consumption reduction">
          <div className="review-grid compact-review">
            <ReviewStatCard label="Average Daily Consumption" value={consumptionControl.weekly.averageDailyConsumption} />
            <ReviewStatCard label="Videos Avoided" value={consumptionControl.weekly.videosAvoided} />
            <ReviewStatCard label="Estimated Time Saved" value={consumptionControl.weekly.estimatedTimeSaved} />
            <ReviewStatCard label="Focus Hours Gained" value={consumptionControl.weekly.focusHoursGained} />
          </div>
        </Card>
      </div>

      <Card title="Dopamine Awareness" label="Educational brief" className="awareness-card">
        <p>
          Short-form content trains the brain to seek constant novelty. Reducing excessive
          consumption improves focus, memory, discipline, and deep work by lowering the demand for
          rapid reward switching.
        </p>
      </Card>

      <Card title="Healthy Habits Suggestions" label="Instead of watching reels">
        <div className="habit-grid">
          {[
            { label: 'Read 10 pages', icon: BookOpen },
            { label: 'Take a short walk', icon: Activity },
            { label: 'Complete a Focus Mission', icon: Target },
            { label: 'Review notes', icon: CheckCircle2 },
            { label: 'Continue coding', icon: Code2 },
          ].map(({ label, icon: Icon }) => (
            <article className="habit-card" key={label}>
              <Icon size={20} />
              <h4>{label}</h4>
            </article>
          ))}
        </div>
      </Card>

      <Card title="Quick Actions" label="Control commands">
        <div className="quick-action-grid">
          <Button onClick={() => navigate('/mission-center')}>Start Focus Mission</Button>
          <Button variant="secondary" onClick={() => navigate('/block-manager')}>Manage Website Blocking</Button>
          <Button variant="secondary" onClick={() => navigate('/analytics')}>View Analytics</Button>
          <Button variant="danger"><RefreshCcw size={15} />Reset Daily Limits</Button>
        </div>
      </Card>

      <Card title="Future Modules" label="Coming Soon">
        <div className="future-grid">
          {futureFeatures.map((feature) => (
            <FutureFeatureCard key={feature} title={feature} />
          ))}
        </div>
      </Card>
    </>
  )
}

export function BlockManagerPage() {
  const [query, setQuery] = useState('')
  const blocked = blockedWebsites.filter((item) => item.site.includes(query.toLowerCase()) || item.category.toLowerCase().includes(query.toLowerCase()))

  return (
    <>
      <PageHeader eyebrow="Block Manager" title="Control Digital Access" description="Manage the websites and categories allowed during discipline windows." />
      <div className="toolbar">
        <Input label="Add website input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search or add domain" />
        <Button><Plus size={15} />Add Custom</Button>
        <Button variant="secondary">Import Preset</Button>
      </div>
      <div className="content-grid split">
        <Card title="Blocked Websites List" label="Denied">
          <WebsiteList items={blocked} danger />
        </Card>
        <Card title="Allowed Websites List" label="Permitted">
          <WebsiteList items={allowedWebsites} />
        </Card>
      </div>
      <Card title="Presets" label="Category badges">
        <div className="badge-row">{categories.map((category) => <Badge key={category} label={category} />)}</div>
      </Card>
    </>
  )
}

function WebsiteList({ items, danger }) {
  return (
    <div className="list-stack">
      {items.map((item) => (
        <div className="compact-row" key={item.id}>
          <strong>{item.site}</strong>
          <Badge label={item.category} tone={danger ? 'danger' : 'default'} />
        </div>
      ))}
    </div>
  )
}

export function SessionHistoryPage() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All')
  const filtered = sessions.filter((session) => {
    const matchesQuery = session.title.toLowerCase().includes(query.toLowerCase())
    const matchesStatus = status === 'All' || session.status === status
    return matchesQuery && matchesStatus
  })
  const grouped = useMemo(
    () =>
      filtered.reduce((groups, session) => {
        groups[session.date] = [...(groups[session.date] || []), session]
        return groups
      }, {}),
    [filtered],
  )

  return (
    <>
      <PageHeader eyebrow="Session History" title="Audit Focus Sessions" description="Search the timeline and inspect completion quality." />
      <div className="stats-grid">
        <StatCard label="Completed" value="42" meta="Last 30 days" icon={CheckCircle2} />
        <StatCard label="Failed" value="7" meta="Requires review" icon={Ban} />
        <StatCard label="Discipline XP" value="4,820" meta="Total earned" icon={Trophy} />
      </div>
      <div className="toolbar">
        <Input label="Search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search sessions" />
        <Select label="Filters" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option>All</option>
          <option>Completed</option>
          <option>Failed</option>
        </Select>
      </div>
      {Object.entries(grouped).map(([date, dateSessions]) => (
        <Card title={date} label="Timeline grouped by date" key={date}>
          <div className="list-stack">{dateSessions.map((session) => <SessionCard key={session.id} session={session} />)}</div>
        </Card>
      ))}
    </>
  )
}

export function StreakCalendarPage() {
  return (
    <>
      <PageHeader eyebrow="Streak Calendar" title="Consistency Record" description="Completed, missed, partial, and today states across the month." />
      <div className="stats-grid">
        <StatCard label="Current Streak" value="12 days" meta="Next milestone: 14" icon={Flame} />
        <StatCard label="Best Streak" value="21 days" meta="Personal record" icon={Trophy} />
        <StatCard label="Completion Rate" value="88%" meta="This month" icon={Activity} />
      </div>
      <Card title="Monthly Calendar Grid" label="June">
        <CalendarGrid days={streakDays} />
      </Card>
      <Card title="Weekly Consistency" label="Next milestone">
        <ProgressBar value={88} />
        <p className="muted-text">Two more clean days unlock the 14 day milestone.</p>
      </Card>
    </>
  )
}

export function DisciplineScorePage() {
  return (
    <>
      <Card className="score-hero">
        <p className="eyebrow">Large Score Hero</p>
        <strong>{disciplineScore.score}</strong>
        <span>Rank: {disciplineScore.rank}</span>
        <ProgressBar value={disciplineScore.xp} />
      </Card>
      <div className="content-grid split">
        <Card title="Rank Ladder" label="Progression">
          <div className="list-stack">{disciplineScore.ladder.map((rank) => <div className="compact-row" key={rank}><span>{rank}</span><Badge label={rank === disciplineScore.rank ? 'Current' : 'Locked'} tone={rank === disciplineScore.rank ? 'default' : 'muted'} /></div>)}</div>
        </Card>
        <Card title="Score Breakdown" label="Inputs">
          <div className="list-stack">{disciplineScore.breakdown.map((item) => <div key={item.label}><div className="card-row"><span>{item.label}</span><strong>{item.value}%</strong></div><ProgressBar value={item.value} /></div>)}</div>
        </Card>
      </div>
      <Card title="Consumption Control" label="Score category">
        <div className="list-stack">
          {disciplineScore.categories.map((category) => (
            <div className="compact-row" key={category.label}>
              <span>{category.label}</span>
              <strong className={category.danger ? 'danger-text' : ''}>{category.value}</strong>
            </div>
          ))}
        </div>
      </Card>
      <Card title="7-Day Score Trend" label="Momentum"><LineChartMock values={analytics.scoreTrend} /></Card>
      <Card title="Achievement Badges" label="Identity shift message"><p className="identity-message">You are becoming the person who keeps promises under resistance.</p></Card>
    </>
  )
}

export function AnalyticsPage() {
  return (
    <>
      <PageHeader eyebrow="Analytics" title="Focus Intelligence" description="Measure hours, success rate, blocks prevented, and saved time." />
      <div className="stats-grid">
        <StatCard label="Mission Success Rate" value={`${analytics.successRate}%`} icon={CheckCircle2} />
        <StatCard label="Blocks Prevented" value={analytics.blocksPrevented} icon={Ban} />
        <StatCard label="Time Saved" value={analytics.timeSaved} icon={Clock} />
        <StatCard label="Weekly Average" value={analytics.weeklyAverage} icon={Activity} />
        <StatCard label="Best Day" value={analytics.bestDay} icon={Trophy} />
        <StatCard label="Total Sessions" value={analytics.totalSessions} icon={Target} />
      </div>
      <Card title="Focus Hours Chart" label="Last 7 days"><MiniBarChart values={analytics.focusHours} /></Card>
      <section className="panel-section">
        <div className="card-head">
          <div>
            <p className="eyebrow">Create more, consume less</p>
            <h3>Consumption Analytics</h3>
          </div>
        </div>
        <div className="content-grid split">
          <Card title="Weekly Reels" label="Videos"><MiniBarChart values={analytics.weeklyReels} /></Card>
          <Card title="Weekly Shorts" label="Videos"><MiniBarChart values={analytics.weeklyShorts} /></Card>
          <Card title="Time Saved" label="Avoided consumption"><LineChartMock values={analytics.consumptionTrend} /></Card>
          <Card title="Consumption Trend" label="Last 7 days"><LineChartMock values={analytics.consumptionTrend} /></Card>
          <Card title="Platform Breakdown" label="Share of consumption"><MiniBarChart values={analytics.platformBreakdown} /></Card>
        </div>
      </section>
    </>
  )
}

export function AchievementsPage() {
  const group = (state) => achievements.filter((achievement) => achievement.state === state)
  return (
    <>
      <PageHeader eyebrow="Achievements" title="Badge Vault" description="Unlocked badges, locked badges, and progress badges." />
      {['Unlocked', 'Progress', 'Locked'].map((state) => (
        <Card key={state} title={`${state} Badges`} label="Recognition">
          <div className="achievement-grid">{group(state).map((achievement) => <AchievementBadge key={achievement.id} achievement={achievement} />)}</div>
        </Card>
      ))}
    </>
  )
}

export function GoalsHubPage() {
  return (
    <>
      <PageHeader eyebrow="Goals Hub" title="Long-Term Goals" description="Connect strategic goals to repeatable focus missions." action={<Button><Plus size={15} />Add New Goal</Button>} />
      <div className="card-grid">{goals.map((goal) => <GoalCard key={goal.id} goal={goal} />)}</div>
    </>
  )
}

export function WeeklyReviewPage() {
  return <ReviewPage title="Weekly Review" range={weeklyReview.range} data={weeklyReview} summary={weeklyReview.summary} />
}

export function MonthlyReviewPage() {
  return (
    <>
      <PageHeader eyebrow="Monthly Review" title="Monthly Discipline Report" description="Total output, success quality, and rank progress." action={<ExportButton />} />
      <div className="review-grid">
        <ReviewStatCard label="Total Focus Hours" value={monthlyReview.focusHours} />
        <ReviewStatCard label="Total Sessions" value={monthlyReview.sessions} />
        <ReviewStatCard label="Success Rate" value={monthlyReview.successRate} />
        <ReviewStatCard label="Discipline Score Gained" value={monthlyReview.scoreGained} />
      </div>
      <Card title="Rank Progress" label="Month end"><ProgressBar value={monthlyReview.rankProgress} /></Card>
    </>
  )
}

function ReviewPage({ title, range, data, summary }) {
  return (
    <>
      <PageHeader eyebrow={range} title={title} description="A blunt audit of the last operating period." />
      <div className="review-grid">
        <ReviewStatCard label="Focus Hours" value={data.focusHours} />
        <ReviewStatCard label="Sessions" value={data.sessions} />
        <ReviewStatCard label="Completed" value={data.completed} />
        <ReviewStatCard label="Failed" value={data.failed} />
        <ReviewStatCard label="Best Day" value={data.bestDay} />
        <ReviewStatCard label="Worst Day" value={data.worstDay} />
        <ReviewStatCard label="Consistency" value={data.consistency} />
      </div>
      <Card title="Motivational Summary" label="Operator note"><p>{summary}</p></Card>
    </>
  )
}

export function IdentityPage() {
  return (
    <>
      <Card className="identity-card">
        <p className="eyebrow">Identity Title</p>
        <strong>DISCIPLINED BUILDER</strong>
        <p>"I do not negotiate with impulses during mission hours."</p>
      </Card>
      <div className="stats-grid">
        <StatCard label="Mission Completed" value="124" icon={CheckCircle2} />
        <StatCard label="Deep Work Hours" value="286h" icon={Clock} />
        <StatCard label="Current Streak" value="12 days" icon={Flame} />
        <StatCard label="Resistance Events" value="247" icon={ShieldCheck} />
        <StatCard label="Healthy Consumption Days" value={consumptionControl.identityStats.healthyDays} icon={ShieldCheck} />
        <StatCard label="Videos Avoided" value={consumptionControl.identityStats.videosAvoided} icon={Ban} />
        <StatCard label="Time Saved" value={consumptionControl.identityStats.timeSaved} icon={Clock} />
        <StatCard label="Digital Discipline Rating" value={consumptionControl.identityStats.rating} icon={Gauge} />
      </div>
    </>
  )
}

export function BrowserExtensionPage() {
  return (
    <>
      <PageHeader eyebrow="Browser Extension" title="Extension Control" description="Monitor connection state and synced blocking results." action={<Button>Manage Extension</Button>} />
      <div className="stats-grid">
        <StatCard label="Extension Status" value="Active" icon={ShieldCheck} />
        <StatCard label="Connected Browser" value="Chrome" icon={Lock} />
        <StatCard label="Sync Status" value="Synced" icon={Activity} />
        <StatCard label="Sites Blocked" value="42" icon={Ban} />
        <StatCard label="Time Saved" value="18.4h" icon={Clock} />
        <StatCard label="Distractions Prevented" value="247" icon={Target} />
      </div>
    </>
  )
}

export function SettingsPage() {
  return (
    <>
      <PageHeader eyebrow="Settings" title="Operating Defaults" description="General, notifications, focus rules, and account controls." />
      <div className="content-grid split">
        <SettingsSection title="General" rows={['Dark mode', 'Start of week']} />
        <SettingsSection title="Notifications" rows={['Daily goal', 'Focus reminder interval']} />
        <SettingsSection title="Focus Rules" rows={['Pause mission on idle', 'Strict mode default']} />
        <SettingsSection title="Account" rows={['Profile email', 'Export data']} />
      </div>
    </>
  )
}

function SettingsSection({ title, rows }) {
  return (
    <Card title={title} label="Settings">
      <div className="list-stack">
        {rows.map((row) => (
          <label className="compact-row" key={row}>
            <span>{row}</span>
            <input type="checkbox" defaultChecked={row !== 'Pause mission on idle'} />
          </label>
        ))}
      </div>
    </Card>
  )
}

export function HelpPage() {
  return (
    <>
      <PageHeader eyebrow="Help & Support" title="Support Desk" description="FAQ, guides, contact, feedback, and quick links." />
      <div className="content-grid split">
        {['FAQ', 'Guides', 'Contact us', 'Feedback', 'Quick links'].map((title) => (
          <Card key={title} title={title} label="Support">
            <p className="muted-text">Reference material for keeping the discipline system operational.</p>
          </Card>
        ))}
      </div>
    </>
  )
}
