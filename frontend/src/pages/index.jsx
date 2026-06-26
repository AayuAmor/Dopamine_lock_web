import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity,
  Archive,
  Ban,
  BookOpen,
  CheckCircle2,
  Code2,
  Clock,
  Edit3,
  Flame,
  Gauge,
  Lock,
  Pause,
  Play,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Smartphone,
  Star,
  Target,
  TimerReset,
  Trash2,
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
  UserAvatar,
} from '../components'
import { useAuth } from '../context/useAuth'
import {
  achievements,
  analytics,
  consumptionControl,
  disciplineScore,
  futureFeatures,
  goals,
  monthlyReview,
  sessions,
  streakDays,
  weeklyReview,
} from '../data/mockData'
import { useBlockManager } from '../hooks/useBlockManager'
import { useMissions } from '../hooks/useMissions'
import { useMissionSession } from '../hooks/useMissionSession'
import {
  createRule,
  deleteRule as deleteBlockRule,
  disablePreset,
  enablePreset,
  toggleRule as toggleBlockRule,
} from '../services/blockManagerService'
import {
  archiveMission,
  createMission,
  deleteMission,
  toggleFavorite,
  updateMission,
} from '../services/missionService'
import {
  abandonMission,
  completeMission,
  pauseMission,
  resumeMission,
  startMission,
} from '../services/missionSessionService'

const missionRules = ['Strict mode', 'Block all notifications', 'Prevent tab switching']
const blockCategories = [
  'SOCIAL_MEDIA',
  'ENTERTAINMENT',
  'GAMING',
  'SHOPPING',
  'NEWS',
  'ADULT',
  'CUSTOM',
  'PRODUCTIVITY',
  'EDUCATION',
]
const blockCategoryLabels = {
  ADULT: 'Adult',
  CUSTOM: 'Custom',
  EDUCATION: 'Education',
  ENTERTAINMENT: 'Entertainment',
  GAMING: 'Gaming',
  NEWS: 'News',
  PRODUCTIVITY: 'Productivity',
  SHOPPING: 'Shopping',
  SOCIAL_MEDIA: 'Social Media',
}
const missionFilters = ['All', 'Favorites', 'Archived', 'Easy', 'Medium', 'Hard']
const missionSorts = ['Newest', 'Oldest', 'Alphabetical', 'Duration', 'Difficulty']
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const bioLimit = 500
const avatarMaxSize = 2 * 1024 * 1024
const avatarTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const defaultMissionForm = {
  title: '',
  goal: '',
  description: '',
  durationMinutes: '',
  difficulty: 'Hard',
  blockedWebsites: '',
  allowedWebsites: '',
  blockedCategories: '',
  strictMode: true,
  blockNotifications: true,
  preventTabSwitching: true,
  status: 'Ready',
}
const defaultBlockRuleForm = {
  category: 'CUSTOM',
  domain: '',
  reason: '',
  type: 'BLOCKED',
}

function formatMemberSince(value) {
  if (!value) {
    return 'Member since unknown'
  }

  return `Member since ${new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))}`
}

function profileFormFromUser(user) {
  return {
    fullName: user?.fullName || '',
    bio: user?.bio || '',
    timezone: user?.timezone || 'Asia/Kathmandu',
    dailyFocusGoal: user?.dailyFocusGoal || 4,
    preferredMissionDuration: user?.preferredMissionDuration || 50,
  }
}

function formatDate(value) {
  if (!value) {
    return 'Unknown'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function formatClock(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0)
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60

  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, '0'))
    .join(':')
}

function formatDuration(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0)
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }

  return `${minutes}m`
}

function formatTime(value) {
  if (!value) {
    return 'Not set'
  }

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function parseList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function missionFormFromMission(mission) {
  if (!mission) {
    return { ...defaultMissionForm }
  }

  return {
    title: mission.title || '',
    goal: mission.goal || '',
    description: mission.description || '',
    durationMinutes: mission.durationMinutes || '',
    difficulty: mission.difficulty || 'Hard',
    blockedWebsites: (mission.blockedWebsites || []).join(', '),
    allowedWebsites: (mission.allowedWebsites || []).join(', '),
    blockedCategories: (mission.blockedCategories || []).join(', '),
    strictMode: mission.strictMode,
    blockNotifications: mission.blockNotifications,
    preventTabSwitching: mission.preventTabSwitching,
    status: mission.status || 'Ready',
  }
}

function missionPayloadFromForm(form) {
  return {
    title: form.title,
    goal: form.goal,
    description: form.description,
    durationMinutes: Number(form.durationMinutes),
    difficulty: form.difficulty,
    blockedWebsites: parseList(form.blockedWebsites),
    allowedWebsites: parseList(form.allowedWebsites),
    blockedCategories: parseList(form.blockedCategories),
    strictMode: form.strictMode,
    blockNotifications: form.blockNotifications,
    preventTabSwitching: form.preventTabSwitching,
    status: form.status,
  }
}

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
  const { effectiveRules, presets } = useBlockManager()
  const { missions: userMissions } = useMissions()
  const { session: currentSession } = useMissionSession()
  const readyMission = userMissions.find((mission) => mission.status === 'Ready' && !mission.archived)
  const activePresetCount = presets.filter((preset) => preset.enabled).length

  return (
    <>
      <PageHeader
        eyebrow="Daily Command"
        title="Discipline Dashboard"
        description={`Welcome back, ${user?.fullName || 'Operator'}. Track the mission, protect attention, and keep the streak intact.`}
      />
      <div className="stats-grid">
        <StatCard
          label="Current Mission"
          value={currentSession ? formatClock(currentSession.remainingSeconds) : 'None'}
          meta={currentSession?.mission?.title || 'No Active Mission'}
          icon={Target}
        />
        <StatCard label="Active Blocked" value={effectiveRules?.blockedDomains?.length || 0} meta="Effective websites" icon={Ban} />
        <StatCard label="Allowed Websites" value={effectiveRules?.allowedDomains?.length || 0} meta="Effective access" icon={ShieldCheck} />
        <StatCard label="Active Presets" value={activePresetCount} meta={`${userMissions.length} missions created`} icon={Flame} />
      </div>
      <div className="content-grid two-one">
        <Card title="Weekly Focus Chart" label="Hours locked">
          <MiniBarChart values={analytics.focusHours} />
        </Card>
        <Card title="Quick Actions" label="Next command">
          <div className="button-stack">
            <ActionLink onClick={() => navigate('/mission-center')}>Create Mission</ActionLink>
            <ActionLink onClick={() => navigate(currentSession ? '/active-mission' : '/mission-center')}>
              {currentSession ? 'Continue Mission' : 'Start Mission'}
            </ActionLink>
            <ActionLink onClick={() => navigate('/mission-center')}>Mission Center</ActionLink>
            {!currentSession && readyMission && <ActionLink onClick={() => navigate('/mission-center')}>Continue Editing</ActionLink>}
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

export function ProfilePage() {
  const { refreshProfile, updateProfile, uploadAvatar, user } = useAuth()
  const { missions: userMissions } = useMissions()
  const { session: currentSession } = useMissionSession()
  const fileInputRef = useRef(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState(() => profileFormFromUser(null))
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')

  useEffect(() => {
    refreshProfile().catch(() => setError('Unable to load profile'))
  }, [refreshProfile])

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview)
      }
    }
  }, [avatarPreview])

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const beginEdit = () => {
    setForm(profileFormFromUser(user))
    setIsEditing(true)
    setError('')
    setSuccess('')
  }

  const validateProfile = () => {
    if (!form.fullName.trim()) {
      return 'Name is required'
    }

    if (form.bio.length > bioLimit) {
      return `Bio must be ${bioLimit} characters or fewer`
    }

    if (Number(form.dailyFocusGoal) <= 0) {
      return 'Daily Goal must be a positive number'
    }

    if (Number(form.preferredMissionDuration) <= 0) {
      return 'Preferred Mission Duration must be a positive number'
    }

    return ''
  }

  const handleSave = async () => {
    const validationError = validateProfile()

    if (validationError) {
      setError(validationError)
      setSuccess('')
      return
    }

    try {
      setIsSaving(true)
      setError('')
      const profile = await updateProfile({
        fullName: form.fullName,
        bio: form.bio,
        timezone: form.timezone,
        dailyFocusGoal: Number(form.dailyFocusGoal),
        preferredMissionDuration: Number(form.preferredMissionDuration),
      })
      setSuccess('Profile updated')
      setIsEditing(false)
      setForm(profileFormFromUser(profile))
    } catch (saveError) {
      setError(saveError.message)
      setSuccess('')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setError('')
    setSuccess('')
    setForm(profileFormFromUser(user))
  }

  const validateAvatarFile = (file) => {
    if (!file) {
      return 'Choose an image to upload'
    }

    if (!avatarTypes.has(file.type)) {
      return 'Only JPG, JPEG, PNG, and WEBP images are allowed'
    }

    if (file.size > avatarMaxSize) {
      return 'Avatar image must be 2MB or smaller'
    }

    return ''
  }

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0]
    const validationError = validateAvatarFile(file)

    if (validationError) {
      setAvatarFile(null)
      setError(validationError)
      setSuccess('')
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview)
        setAvatarPreview('')
      }
      event.target.value = ''
      return
    }

    const previewUrl = URL.createObjectURL(file)
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview)
    }

    setAvatarFile(file)
    setAvatarPreview(previewUrl)
    setError('')
    setSuccess('')
  }

  const handleAvatarSave = async () => {
    const validationError = validateAvatarFile(avatarFile)

    if (validationError) {
      setError(validationError)
      setSuccess('')
      return
    }

    try {
      setIsUploadingAvatar(true)
      setError('')
      await uploadAvatar(avatarFile)
      await refreshProfile()
      setSuccess('Profile photo updated')
      setAvatarFile(null)
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview)
        setAvatarPreview('')
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (uploadError) {
      setError(uploadError.message)
      setSuccess('')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  return (
    <>
      <section className="profile-hero">
        <UserAvatar user={user} size="lg" />
        <div>
          <p className="eyebrow">User Profile</p>
          <h2>{user?.fullName || 'Operator'}</h2>
          <p>{user?.disciplineTitle || 'DISCIPLINED BUILDER'}</p>
          <span>{formatMemberSince(user?.createdAt)}</span>
        </div>
        <Badge label="Current Status: Active" />
      </section>

      {(error || success) && (
        <p className={error ? 'form-error' : 'form-success'}>{error || success}</p>
      )}

      <div className="content-grid split">
        <Card
          title="Profile Information"
          label="Authenticated data"
          action={!isEditing && <Button variant="secondary" onClick={beginEdit}>Edit Profile</Button>}
        >
          {!isEditing ? (
            <div className="profile-details">
              <ProfileDetail label="Full Name" value={user?.fullName} />
              <ProfileDetail label="Email" value={user?.email} />
              <ProfileDetail label="Discipline Title" value={user?.disciplineTitle} />
              <ProfileDetail label="Bio" value={user?.bio || 'No bio set'} />
              <ProfileDetail label="Total Missions Created" value={userMissions.length} />
              <ProfileDetail label="Current Active Mission" value={currentSession?.mission?.title || 'No active mission'} />
              <ProfileDetail label="Current Session Duration" value={currentSession ? formatDuration(currentSession.elapsedSeconds) : '0m'} />
              <ProfileDetail label="Daily Goal" value={`${user?.dailyFocusGoal || 4} hours`} />
              <ProfileDetail label="Preferred Mission Duration" value={`${user?.preferredMissionDuration || 50} minutes`} />
              <ProfileDetail label="Timezone" value={user?.timezone} />
            </div>
          ) : (
            <div className="form-stack">
              <Input label="Name" value={form.fullName} onChange={(event) => updateField('fullName', event.target.value)} />
              <label className="field">
                <span>Bio</span>
                <textarea value={form.bio} maxLength={bioLimit} onChange={(event) => updateField('bio', event.target.value)} />
              </label>
              <Input label="Timezone" value={form.timezone} onChange={(event) => updateField('timezone', event.target.value)} />
              <Input label="Daily Goal" type="number" min="1" value={form.dailyFocusGoal} onChange={(event) => updateField('dailyFocusGoal', event.target.value)} />
              <Input label="Preferred Mission Duration" type="number" min="1" value={form.preferredMissionDuration} onChange={(event) => updateField('preferredMissionDuration', event.target.value)} />
              <div className="splash-actions">
                <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving' : 'Save'}</Button>
                <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
              </div>
            </div>
          )}
        </Card>
        <Card title="Profile Picture" label="Avatar">
          <div className="profile-avatar-card">
            <UserAvatar user={{ ...user, avatarUrl: avatarPreview || user?.avatarUrl }} size="lg" />
            <input
              ref={fileInputRef}
              className="avatar-file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
            />
            <div className="avatar-actions">
              <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                Upload Photo
              </Button>
              <Button onClick={handleAvatarSave} disabled={!avatarFile || isUploadingAvatar}>
                {isUploadingAvatar ? 'Saving Avatar' : 'Save Avatar'}
              </Button>
            </div>
            {avatarFile && <p className="muted-text">{avatarFile.name}</p>}
          </div>
        </Card>
      </div>
    </>
  )
}

function ProfileDetail({ label, value }) {
  return (
    <div className="compact-row">
      <span>{label}</span>
      <strong>{value || 'Not set'}</strong>
    </div>
  )
}

export function MissionCenterPage() {
  const navigate = useNavigate()
  const {
    error: loadError,
    isLoading,
    missions: userMissions,
    refreshMissions,
  } = useMissions()
  const {
    refreshSession,
    session: currentSession,
  } = useMissionSession()
  const [form, setForm] = useState(() => ({ ...defaultMissionForm }))
  const [editingMissionId, setEditingMissionId] = useState(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [sort, setSort] = useState('Newest')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const filteredMissions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return [...userMissions]
      .filter((mission) => {
        if (filter === 'Favorites') {
          return mission.favorite && !mission.archived
        }

        if (filter === 'Archived') {
          return mission.archived
        }

        if (['Easy', 'Medium', 'Hard'].includes(filter)) {
          return mission.difficulty === filter && !mission.archived
        }

        return !mission.archived
      })
      .filter((mission) => {
        if (!normalizedQuery) {
          return true
        }

        return [mission.title, mission.goal, mission.description]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedQuery))
      })
      .sort((a, b) => {
        if (sort === 'Oldest') {
          return new Date(a.createdAt) - new Date(b.createdAt)
        }

        if (sort === 'Alphabetical') {
          return a.title.localeCompare(b.title)
        }

        if (sort === 'Duration') {
          return a.durationMinutes - b.durationMinutes
        }

        if (sort === 'Difficulty') {
          const weights = { Easy: 1, Medium: 2, Hard: 3 }
          return weights[a.difficulty] - weights[b.difficulty]
        }

        return new Date(b.createdAt) - new Date(a.createdAt)
      })
  }, [filter, query, sort, userMissions])

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const validateMissionForm = () => {
    if (!form.title.trim()) {
      return 'Mission title is required'
    }

    if (!form.goal.trim()) {
      return 'Goal is required'
    }

    if (!Number.isFinite(Number(form.durationMinutes)) || Number(form.durationMinutes) <= 0) {
      return 'Duration must be a positive number'
    }

    if (!['Easy', 'Medium', 'Hard'].includes(form.difficulty)) {
      return 'Difficulty must be Easy, Medium, or Hard'
    }

    return ''
  }

  const resetForm = () => {
    setForm({ ...defaultMissionForm })
    setEditingMissionId(null)
    setError('')
    setSuccess('')
  }

  const handleSaveMission = async () => {
    const validationError = validateMissionForm()

    if (validationError) {
      setError(validationError)
      setSuccess('')
      return
    }

    try {
      setIsSaving(true)
      setError('')
      const payload = missionPayloadFromForm(form)

      if (editingMissionId) {
        await updateMission(editingMissionId, payload)
        setSuccess('Mission updated')
      } else {
        await createMission(payload)
        setSuccess('Mission created')
      }

      await refreshMissions()
      setForm({ ...defaultMissionForm })
      setEditingMissionId(null)
    } catch (saveError) {
      setError(saveError.message)
      setSuccess('')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditMission = (mission) => {
    setForm(missionFormFromMission(mission))
    setEditingMissionId(mission.id)
    setError('')
    setSuccess('')
  }

  const handleMissionAction = async (action, successMessage) => {
    try {
      setError('')
      await action()
      await refreshMissions()
      setSuccess(successMessage)
    } catch (actionError) {
      setError(actionError.message)
      setSuccess('')
    }
  }

  const handleStartMission = async (mission) => {
    try {
      setError('')
      await startMission(mission.id)
      await refreshSession()
      setSuccess('Mission started')
      navigate('/active-mission')
    } catch (startError) {
      setError(startError.message)
      setSuccess('')
    }
  }

  return (
    <>
      <PageHeader eyebrow="Mission Center" title="Create Focus Mission" description="Define the objective, constraints, and resistance protocol." />
      {(error || loadError || success) && (
        <p className={error || loadError ? 'form-error' : 'form-success'}>{error || loadError || success}</p>
      )}
      {currentSession && (
        <p className="form-error">Finish your current mission before starting another.</p>
      )}
      <div className="content-grid split">
        <Card title="Create Mission Form" label="Mission design">
          <div className="form-grid">
            <Input label="Mission name" value={form.title} onChange={(event) => updateField('title', event.target.value)} placeholder="Deep Work: DSA Blocks" />
            <Input label="Goal" value={form.goal} onChange={(event) => updateField('goal', event.target.value)} placeholder="Complete graph traversal drills" />
            <Input label="Duration" type="number" min="1" value={form.durationMinutes} onChange={(event) => updateField('durationMinutes', event.target.value)} placeholder="90 minutes" />
            <Select label="Difficulty" value={form.difficulty} onChange={(event) => updateField('difficulty', event.target.value)}>
              {['Easy', 'Medium', 'Hard'].map((difficulty) => <option key={difficulty}>{difficulty}</option>)}
            </Select>
            <label className="field form-span-full">
              <span>Description</span>
              <textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} placeholder="Optional mission context" />
            </label>
            <Input label="Blocked websites" value={form.blockedWebsites} onChange={(event) => updateField('blockedWebsites', event.target.value)} placeholder="youtube.com, x.com" />
            <Input label="Allowed websites" value={form.allowedWebsites} onChange={(event) => updateField('allowedWebsites', event.target.value)} placeholder="leetcode.com, github.com" />
            <Input label="Blocked categories" value={form.blockedCategories} onChange={(event) => updateField('blockedCategories', event.target.value)} placeholder="Social, Video, Gaming" />
            <Select label="Status" value={form.status} onChange={(event) => updateField('status', event.target.value)}>
              {['Draft', 'Ready'].map((status) => <option key={status}>{status}</option>)}
            </Select>
          </div>
          <div className="toggle-list">
            <label><input type="checkbox" checked={form.strictMode} onChange={(event) => updateField('strictMode', event.target.checked)} /> Strict Mode</label>
            <label><input type="checkbox" checked={form.blockNotifications} onChange={(event) => updateField('blockNotifications', event.target.checked)} /> Block Notifications</label>
            <label><input type="checkbox" checked={form.preventTabSwitching} onChange={(event) => updateField('preventTabSwitching', event.target.checked)} /> Prevent Tab Switching</label>
          </div>
          <div className="splash-actions">
            <Button onClick={handleSaveMission} disabled={isSaving}>
              <Plus size={15} />{isSaving ? 'Saving Mission' : editingMissionId ? 'Save Mission' : 'Create Mission'}
            </Button>
            <Button variant="secondary" onClick={resetForm}>Cancel</Button>
          </div>
        </Card>
        <Card title="Mission List" label={isLoading ? 'Loading missions' : `${filteredMissions.length} shown`}>
          <div className="form-grid mission-controls">
            <Input label="Search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search missions" />
            <Select label="Filter" value={filter} onChange={(event) => setFilter(event.target.value)}>
              {missionFilters.map((item) => <option key={item}>{item}</option>)}
            </Select>
            <Select label="Sort" value={sort} onChange={(event) => setSort(event.target.value)}>
              {missionSorts.map((item) => <option key={item}>{item}</option>)}
            </Select>
          </div>
          <div className="list-stack">
            {filteredMissions.map((mission) => (
              <MissionListItem
                key={mission.id}
                mission={mission}
                onArchive={() => handleMissionAction(
                  () => archiveMission(mission.id, !mission.archived),
                  mission.archived ? 'Mission restored' : 'Mission archived',
                )}
                onDelete={() => handleMissionAction(() => deleteMission(mission.id), 'Mission deleted')}
                onEdit={() => handleEditMission(mission)}
                onFavorite={() => handleMissionAction(() => toggleFavorite(mission.id), 'Favorite updated')}
                onStart={() => handleStartMission(mission)}
                startDisabled={Boolean(currentSession) || mission.archived}
              />
            ))}
            {!isLoading && filteredMissions.length === 0 && (
              <p className="muted-text">No missions match the current view.</p>
            )}
          </div>
        </Card>
      </div>
      <Card title="Mission Rules" label="Default protection">
        <div className="badge-row">{missionRules.map((rule) => <Badge key={rule} label={rule} />)}</div>
      </Card>
    </>
  )
}

function MissionListItem({
  mission,
  onArchive,
  onDelete,
  onEdit,
  onFavorite,
  onStart,
  startDisabled,
}) {
  return (
    <article className="mission-list-item">
      <div className="mission-list-main">
        <div>
          <strong>{mission.title}</strong>
          <span>{mission.goal}</span>
          {mission.description && <p>{mission.description}</p>}
        </div>
        <div className="badge-row">
          <Badge label={mission.difficulty} />
          <Badge label={mission.status} tone={mission.archived ? 'muted' : 'default'} />
        </div>
      </div>
      <div className="mission-list-meta">
        <span>{mission.durationMinutes} minutes</span>
        <span>Created {formatDate(mission.createdAt)}</span>
      </div>
      <div className="mission-actions">
        <Button disabled={startDisabled} onClick={onStart}><Play size={15} />Start Mission</Button>
        <Button variant="secondary" onClick={onEdit}><Edit3 size={15} />Edit</Button>
        <Button variant="secondary" onClick={onFavorite}><Star size={15} />{mission.favorite ? 'Unfavorite' : 'Favorite'}</Button>
        <Button variant="secondary" onClick={onArchive}><Archive size={15} />{mission.archived ? 'Restore' : 'Archive'}</Button>
        <Button variant="danger" onClick={onDelete}><Trash2 size={15} />Delete</Button>
      </div>
    </article>
  )
}

export function ActiveMissionPage() {
  const navigate = useNavigate()
  const { effectiveRules } = useBlockManager()
  const {
    error: loadError,
    isLoading,
    refreshSession,
    session,
  } = useMissionSession()
  const [clockNow, setClockNow] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const sessionId = session?.id
  const sessionStatus = session?.status

  const liveSession = useMemo(() => {
    if (!session || session.status !== 'ACTIVE') {
      return session
    }

    const serverNow = session.serverNow ? new Date(session.serverNow).getTime() : 0
    const tickDelta = clockNow && serverNow
      ? Math.max(0, Math.floor((clockNow - serverNow) / 1000))
      : 0
    const elapsedSeconds = session.elapsedSeconds + tickDelta
    const remainingSeconds = Math.max(0, session.remainingSeconds - tickDelta)
    const totalSeconds = elapsedSeconds + remainingSeconds
    const completionPercentage = totalSeconds > 0
      ? Math.min(100, Math.round((elapsedSeconds / totalSeconds) * 100))
      : session.completionPercentage

    return {
      ...session,
      completionPercentage,
      elapsedSeconds,
      remainingSeconds,
    }
  }, [clockNow, session])
  const mission = liveSession?.mission
  const effectiveBlockedDomains = effectiveRules?.blockedDomains || []
  const effectiveAllowedDomains = effectiveRules?.allowedDomains || []

  useEffect(() => {
    if (sessionStatus !== 'ACTIVE') {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      setClockNow(Date.now())
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [sessionId, sessionStatus])

  const handleSessionAction = async (action, successMessage) => {
    try {
      setError('')
      await action()
      await refreshSession()
      setSuccess(successMessage)
    } catch (actionError) {
      setError(actionError.message)
      setSuccess('')
    }
  }

  if (isLoading) {
    return <p className="route-loading">Loading active mission</p>
  }

  if (!liveSession || !mission) {
    return (
      <>
        <PageHeader eyebrow="Active Mission" title="No Active Mission" description="Start a mission from Mission Center to begin a focus session." />
        {(loadError || error || success) && (
          <p className={loadError || error ? 'form-error' : 'form-success'}>{loadError || error || success}</p>
        )}
        <Card className="mission-hero">
          <p className="eyebrow">Mission Timer</p>
          <strong>00:00:00</strong>
          <span>No active mission</span>
          <ProgressBar value={0} />
        </Card>
        <Button onClick={() => navigate('/mission-center')}><Play size={15} />Start Mission</Button>
      </>
    )
  }

  const rules = [
    { label: 'Strict Mode', enabled: mission.strictMode },
    { label: 'Block Notifications', enabled: mission.blockNotifications },
    { label: 'Prevent Tab Switching', enabled: mission.preventTabSwitching },
  ]

  return (
    <>
      <PageHeader eyebrow="Active Mission" title={mission.title} description={mission.goal} />
      {(loadError || error || success) && (
        <p className={loadError || error ? 'form-error' : 'form-success'}>{loadError || error || success}</p>
      )}
      <Card className="mission-hero">
        <p className="eyebrow">Mission Timer</p>
        <strong>{formatClock(liveSession.remainingSeconds)}</strong>
        <span>{formatDuration(liveSession.elapsedSeconds)} elapsed - {liveSession.status}</span>
        <ProgressBar value={liveSession.completionPercentage} />
      </Card>
      <div className="stats-grid">
        <StatCard label="Progress" value={`${liveSession.completionPercentage}%`} meta={mission.difficulty} icon={Gauge} />
        <StatCard label="Elapsed Time" value={formatDuration(liveSession.elapsedSeconds)} meta={`Started ${formatTime(liveSession.startedAt)}`} icon={Clock} />
        <StatCard label="Remaining" value={formatDuration(liveSession.remainingSeconds)} meta={liveSession.estimatedFinishAt ? `Ends ${formatTime(liveSession.estimatedFinishAt)}` : 'Paused'} icon={Target} />
        <StatCard label="Blocked Categories" value={mission.blockedCategories.length} meta={mission.blockedCategories.join(', ') || 'None'} icon={Lock} />
      </div>
      <div className="content-grid split">
        <Card title="Mission Rules" label="Enforced">
          <div className="list-stack">{rules.map((rule) => <div className="compact-row" key={rule.label}><span>{rule.label}</span><Badge label={rule.enabled ? 'On' : 'Off'} /></div>)}</div>
        </Card>
        <Card title="Blocked Websites" label="Impulse perimeter">
          <div className="badge-row">
            {[...new Set([...effectiveBlockedDomains, ...mission.blockedWebsites])].length > 0
              ? [...new Set([...effectiveBlockedDomains, ...mission.blockedWebsites])].map((site) => <Badge key={site} label={site} />)
              : <p className="muted-text">No blocked websites set.</p>}
          </div>
        </Card>
      </div>
      <div className="content-grid split">
        <Card title="Allowed Websites" label="Permitted">
          <div className="badge-row">
            {[...new Set([...effectiveAllowedDomains, ...mission.allowedWebsites])].length > 0
              ? [...new Set([...effectiveAllowedDomains, ...mission.allowedWebsites])].map((site) => <Badge key={site} label={site} />)
              : <p className="muted-text">No allowed websites set.</p>}
          </div>
        </Card>
        <Card title="Session State" label="Recovery data">
          <div className="profile-details">
            <ProfileDetail label="Current Status" value={liveSession.status} />
            <ProfileDetail label="Started Time" value={formatTime(liveSession.startedAt)} />
            <ProfileDetail label="Estimated Finish" value={liveSession.estimatedFinishAt ? formatTime(liveSession.estimatedFinishAt) : 'Paused'} />
          </div>
        </Card>
      </div>
      <div className="splash-actions">
        {liveSession.status === 'ACTIVE' ? (
          <Button variant="secondary" onClick={() => handleSessionAction(pauseMission, 'Mission paused')}><Pause size={15} />Pause</Button>
        ) : (
          <Button onClick={() => handleSessionAction(resumeMission, 'Mission resumed')}><Play size={15} />Resume</Button>
        )}
        <Button
          disabled={liveSession.status === 'PAUSED'}
          onClick={() => handleSessionAction(completeMission, 'Mission completed')}
        >
          <CheckCircle2 size={15} />Complete Mission
        </Button>
        <Button variant="danger" onClick={() => handleSessionAction(abandonMission, 'Mission abandoned')}><Ban size={15} />Abandon Mission</Button>
      </div>
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
  const {
    error: loadError,
    isLoading,
    presets,
    refreshBlockManager,
    rules,
  } = useBlockManager()
  const [form, setForm] = useState(() => ({ ...defaultBlockRuleForm }))
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const activePresets = presets.filter((preset) => preset.enabled)
  const filteredRules = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return rules.filter((rule) => {
      const matchesSearch = !normalizedQuery
        || rule.domain.includes(normalizedQuery)
        || blockCategoryLabels[rule.category].toLowerCase().includes(normalizedQuery)
        || (rule.reason || '').toLowerCase().includes(normalizedQuery)
      const matchesCategory = categoryFilter === 'All' || rule.category === categoryFilter

      return matchesSearch && matchesCategory
    })
  }, [categoryFilter, query, rules])
  const blocked = filteredRules.filter((rule) => rule.type === 'BLOCKED')
  const allowed = filteredRules.filter((rule) => rule.type === 'ALLOWED')

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleAddRule = async () => {
    try {
      setError('')
      await createRule(form)
      await refreshBlockManager()
      setForm({ ...defaultBlockRuleForm })
      setSuccess('Block rule added')
    } catch (ruleError) {
      setError(ruleError.message)
      setSuccess('')
    }
  }

  const handleRuleAction = async (action, successMessage) => {
    try {
      setError('')
      await action()
      await refreshBlockManager()
      setSuccess(successMessage)
    } catch (actionError) {
      setError(actionError.message)
      setSuccess('')
    }
  }

  const handlePresetAction = async (preset) => {
    await handleRuleAction(
      () => (preset.enabled ? disablePreset(preset.id) : enablePreset(preset.id)),
      preset.enabled ? 'Preset disabled' : 'Preset enabled',
    )
  }

  return (
    <>
      <PageHeader eyebrow="Block Manager" title="Control Digital Access" description="Manage the websites and categories allowed during discipline windows." />
      {(error || loadError || success) && (
        <p className={error || loadError ? 'form-error' : 'form-success'}>{error || loadError || success}</p>
      )}
      <div className="toolbar">
        <Input label="Search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search domains or categories" />
        <Select label="Category filter" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
          <option>All</option>
          {blockCategories.map((category) => <option key={category} value={category}>{blockCategoryLabels[category]}</option>)}
        </Select>
      </div>
      <Card title="Add Website Rule" label="Custom access">
        <div className="form-grid">
          <Input label="Domain" value={form.domain} onChange={(event) => updateField('domain', event.target.value)} placeholder="youtube.com" />
          <Select label="Type" value={form.type} onChange={(event) => updateField('type', event.target.value)}>
            <option value="BLOCKED">Blocked</option>
            <option value="ALLOWED">Allowed</option>
          </Select>
          <Select label="Category" value={form.category} onChange={(event) => updateField('category', event.target.value)}>
            {blockCategories.map((category) => <option key={category} value={category}>{blockCategoryLabels[category]}</option>)}
          </Select>
          <Input label="Reason" value={form.reason} onChange={(event) => updateField('reason', event.target.value)} placeholder="Optional reason" />
        </div>
        <Button onClick={handleAddRule}><Plus size={15} />Add Custom</Button>
      </Card>
      <div className="content-grid split">
        <Card title="Blocked Websites List" label={isLoading ? 'Loading' : `${blocked.length} denied`}>
          <WebsiteList
            danger
            items={blocked}
            onDelete={(rule) => handleRuleAction(() => deleteBlockRule(rule.id), 'Rule deleted')}
            onToggle={(rule) => handleRuleAction(() => toggleBlockRule(rule.id), 'Rule updated')}
          />
        </Card>
        <Card title="Allowed Websites List" label={isLoading ? 'Loading' : `${allowed.length} permitted`}>
          <WebsiteList
            items={allowed}
            onDelete={(rule) => handleRuleAction(() => deleteBlockRule(rule.id), 'Rule deleted')}
            onToggle={(rule) => handleRuleAction(() => toggleBlockRule(rule.id), 'Rule updated')}
          />
        </Card>
      </div>
      <Card title="Active Presets" label={`${activePresets.length} enabled`}>
        <div className="list-stack">
          {presets.map((preset) => (
            <div className="compact-row" key={preset.id}>
              <div>
                <strong>{preset.name}</strong>
                <span>{preset.description}</span>
              </div>
              <div className="splash-actions">
                <Badge label={blockCategoryLabels[preset.category]} />
                <Badge label={`${preset.websites.length} sites`} />
                <Button variant={preset.enabled ? 'danger' : 'secondary'} onClick={() => handlePresetAction(preset)}>
                  {preset.enabled ? 'Disable' : 'Enable'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card title="Presets" label="Category badges">
        <div className="badge-row">{blockCategories.map((category) => <Badge key={category} label={blockCategoryLabels[category]} />)}</div>
      </Card>
    </>
  )
}

function WebsiteList({ items, danger, onDelete, onToggle }) {
  return (
    <div className="list-stack">
      {items.map((item) => (
        <div className="compact-row" key={item.id}>
          <div>
            <strong>{item.domain}</strong>
            <span>{item.reason || blockCategoryLabels[item.category]}</span>
          </div>
          <div className="splash-actions">
            <Badge label={blockCategoryLabels[item.category]} tone={danger ? 'danger' : 'default'} />
            <Badge label={item.active ? 'Active' : 'Inactive'} tone={item.active ? 'default' : 'muted'} />
            <Button variant="secondary" onClick={() => onToggle(item)}>{item.active ? 'Disable' : 'Enable'}</Button>
            <Button variant="danger" onClick={() => onDelete(item)}>Delete</Button>
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="muted-text">No websites match this view.</p>}
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
  const { missions: userMissions } = useMissions()
  const goalsWithMissionCounts = goals.map((goal) => {
    const keywords = goal.title
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3)
    const missionCount = userMissions.filter((mission) => {
      const searchableMission = [mission.title, mission.goal, mission.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return keywords.some((keyword) => searchableMission.includes(keyword))
    }).length

    return { ...goal, missions: missionCount }
  })

  return (
    <>
      <PageHeader eyebrow="Goals Hub" title="Long-Term Goals" description="Connect strategic goals to repeatable focus missions." action={<Button><Plus size={15} />Add New Goal</Button>} />
      <div className="card-grid">{goalsWithMissionCounts.map((goal) => <GoalCard key={goal.id} goal={goal} />)}</div>
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
  const { user } = useAuth()

  return (
    <>
      <Card className="identity-card">
        <UserAvatar user={user} size="lg" />
        <p className="eyebrow">Identity Title</p>
        <strong>{user?.disciplineTitle || 'DISCIPLINED BUILDER'}</strong>
        <p>{user?.bio || '"I do not negotiate with impulses during mission hours."'}</p>
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
  const { effectiveRules, presets } = useBlockManager()
  const activePresetCount = presets.filter((preset) => preset.enabled).length

  return (
    <>
      <PageHeader eyebrow="Browser Extension" title="Extension Control" description="Monitor connection state and synced blocking results." action={<Button>Manage Extension</Button>} />
      <div className="stats-grid">
        <StatCard label="Extension Status" value="Ready" icon={ShieldCheck} />
        <StatCard label="Sync Status" value="Sync-ready" icon={Activity} />
        <StatCard label="Effective Blocked" value={effectiveRules?.blockedDomains?.length || 0} icon={Ban} />
        <StatCard label="Allowed Websites" value={effectiveRules?.allowedDomains?.length || 0} icon={Lock} />
        <StatCard label="Active Presets" value={activePresetCount} icon={Target} />
        <StatCard label="Sync Engine" value="Pending" icon={Clock} />
      </div>
    </>
  )
}

export function SettingsPage() {
  const { user } = useAuth()

  return (
    <>
      <PageHeader eyebrow="Settings" title="Operating Defaults" description="General, notifications, focus rules, and account controls." />
      <Card title="Profile" label="Authenticated user">
        <div className="settings-profile">
          <UserAvatar user={user} size="md" />
          <div>
            <h3>{user?.fullName || 'Operator'}</h3>
            <p>{user?.email}</p>
            <p>{user?.disciplineTitle || 'DISCIPLINED BUILDER'}</p>
          </div>
        </div>
        <div className="review-grid compact-review">
          <ReviewStatCard label="Daily Goal" value={`${user?.dailyFocusGoal || 4}h`} />
          <ReviewStatCard label="Mission Duration" value={`${user?.preferredMissionDuration || 50}m`} />
          <ReviewStatCard label="Timezone" value={user?.timezone || 'Asia/Kathmandu'} />
          <ReviewStatCard label="Member Since" value={formatMemberSince(user?.createdAt).replace('Member since ', '')} />
        </div>
      </Card>
      <div className="content-grid split">
        <SettingsSection title="General" rows={['Dark mode', 'Start of week']} />
        <SettingsSection title="Notifications" rows={['Daily goal', 'Focus reminder interval']} />
        <SettingsSection title="Focus Rules" rows={['Pause mission on idle', 'Strict mode default']} />
        <SettingsSection title="Account" rows={['Export data']} />
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
