import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
} from "lucide-react";
import {
  AchievementBadge,
  ActionLink,
  Badge,
  Button,
  CalendarGrid,
  Card,
  FutureFeatureCard,
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
} from "../components";
import { useAuth } from "../context/useAuth";
import { futureFeatures } from "../data/mockData";
import { useAnalytics } from "../hooks/useAnalytics";
import { useBlockManager } from "../hooks/useBlockManager";
import { useConsumption } from "../hooks/useConsumption";
import { useDisciplineScore } from "../hooks/useDisciplineScore";
import { useAchievements } from "../hooks/useAchievements";
import { useGoals } from "../hooks/useGoals";
import { useIdentity } from "../hooks/useIdentity";
import { useMissions } from "../hooks/useMissions";
import { useMonthlyReview } from "../hooks/useMonthlyReview";
import { useMissionSession } from "../hooks/useMissionSession";
import { useSessionHistory } from "../hooks/useSessionHistory";
import { useStreak } from "../hooks/useStreak";
import { useWeeklyReview } from "../hooks/useWeeklyReview";
import {
  getConsumptionAnalytics,
  getDashboard,
  getFocus,
  getMissionAnalytics,
  getOverview,
} from "../services/analyticsService";
import {
  createRule,
  deleteRule as deleteBlockRule,
  disablePreset,
  enablePreset,
  toggleRule as toggleBlockRule,
} from "../services/blockManagerService";
import {
  createLog as createConsumptionLog,
  updateLimits as updateConsumptionLimits,
} from "../services/consumptionService";
import { recalculateScore } from "../services/disciplineScoreService";
import {
  archiveGoal,
  completeGoal as completeGoalById,
  connectMission,
  createGoal,
  pauseGoal,
  removeMission,
  resumeGoal,
  updateGoal,
  updateGoalProgress,
} from "../services/goalService";
import {
  archiveMission,
  createMission,
  deleteMission,
  toggleFavorite,
  updateMission,
} from "../services/missionService";
import {
  abandonMission,
  completeMission,
  pauseMission,
  resumeMission,
  startMission,
} from "../services/missionSessionService";
import { recalculate as recalculateAchievements } from "../services/achievementService";
import { recalculate as recalculateIdentity } from "../services/identityService";
import { getSession as getHistorySession } from "../services/sessionHistoryService";

const missionRules = [
  "Strict mode",
  "Block all notifications",
  "Prevent tab switching",
];
const blockCategories = [
  "SOCIAL_MEDIA",
  "ENTERTAINMENT",
  "GAMING",
  "SHOPPING",
  "NEWS",
  "ADULT",
  "CUSTOM",
  "PRODUCTIVITY",
  "EDUCATION",
];
const blockCategoryLabels = {
  ADULT: "Adult",
  CUSTOM: "Custom",
  EDUCATION: "Education",
  ENTERTAINMENT: "Entertainment",
  GAMING: "Gaming",
  NEWS: "News",
  PRODUCTIVITY: "Productivity",
  SHOPPING: "Shopping",
  SOCIAL_MEDIA: "Social Media",
};
const missionFilters = [
  "All",
  "Favorites",
  "Archived",
  "Easy",
  "Medium",
  "Hard",
];
const missionSorts = [
  "Newest",
  "Oldest",
  "Alphabetical",
  "Duration",
  "Difficulty",
];
const sessionFilters = [
  "All",
  "Completed",
  "Abandoned",
  "Today",
  "This Week",
  "This Month",
];
const sessionSorts = [
  "Newest",
  "Oldest",
  "Duration",
  "Completion Time",
  "Mission Name",
];
const disciplineRankLadder = ["D", "C", "B", "A", "S", "S+"];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const bioLimit = 500;
const avatarMaxSize = 2 * 1024 * 1024;
const avatarTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const defaultMissionForm = {
  title: "",
  goal: "",
  description: "",
  durationMinutes: "",
  difficulty: "Hard",
  blockedWebsites: "",
  allowedWebsites: "",
  blockedCategories: "",
  strictMode: true,
  blockNotifications: true,
  preventTabSwitching: true,
  status: "Ready",
};
const defaultBlockRuleForm = {
  category: "CUSTOM",
  domain: "",
  reason: "",
  type: "BLOCKED",
};
const defaultConsumptionLogForm = {
  minutesConsumed: 15,
  platformSlug: "youtube-shorts",
  videosWatched: 5,
};

const goalCategories = [
  "STUDY",
  "CODING",
  "FITNESS",
  "READING",
  "PROJECT",
  "DIGITAL_DETOX",
  "CONSISTENCY",
  "CUSTOM",
];
const goalPriorities = ["LOW", "MEDIUM", "HIGH"];
const defaultGoalForm = {
  title: "",
  description: "",
  category: "STUDY",
  priority: "MEDIUM",
  targetValue: "",
  currentValue: "0",
  unit: "sessions",
  targetDate: "",
};

function formatMemberSince(value) {
  if (!value) {
    return "Member since unknown";
  }

  return `Member since ${new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(value))}`;
}

function profileFormFromUser(user) {
  return {
    fullName: user?.fullName || "",
    bio: user?.bio || "",
    timezone: user?.timezone || "Asia/Kathmandu",
    dailyFocusGoal: user?.dailyFocusGoal || 4,
    preferredMissionDuration: user?.preferredMissionDuration || 50,
  };
}

function formatDate(value) {
  if (!value) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatClock(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

function formatDuration(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function formatTime(value) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function sessionTimelineGroup(value) {
  if (!value) {
    return "Earlier";
  }

  const sessionDate = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(
    today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1),
  );

  if (sessionDate.toDateString() === today.toDateString()) {
    return "Today";
  }

  if (sessionDate.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  if (sessionDate >= weekStart) {
    return "This Week";
  }

  return "Earlier";
}

function sessionCardFromHistory(session) {
  return {
    id: session.id,
    date: sessionTimelineGroup(session.endedAt),
    duration: `${session.actualDurationMinutes || Math.round(session.elapsedSeconds / 60)} min`,
    status: session.status === "COMPLETED" ? "Completed" : "Abandoned",
    time: `${formatTime(session.startedAt)} - ${formatTime(session.endedAt)}`,
    title: session.mission?.title || "Untitled Mission",
    xp: `${session.completionPercentage}%`,
  };
}

function parseList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function missionFormFromMission(mission) {
  if (!mission) {
    return { ...defaultMissionForm };
  }

  return {
    title: mission.title || "",
    goal: mission.goal || "",
    description: mission.description || "",
    durationMinutes: mission.durationMinutes || "",
    difficulty: mission.difficulty || "Hard",
    blockedWebsites: (mission.blockedWebsites || []).join(", "),
    allowedWebsites: (mission.allowedWebsites || []).join(", "),
    blockedCategories: (mission.blockedCategories || []).join(", "),
    strictMode: mission.strictMode,
    blockNotifications: mission.blockNotifications,
    preventTabSwitching: mission.preventTabSwitching,
    status: mission.status || "Ready",
  };
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
  };
}

function validateAuthFields(fields, requireName = false) {
  if (requireName && !fields.fullName.trim()) {
    return "Full name is required";
  }

  if (!fields.email.trim() || !fields.password) {
    return "Email and password are required";
  }

  if (!emailPattern.test(fields.email.trim())) {
    return "Enter a valid email address";
  }

  if (fields.password.length < 6) {
    return "Password must be at least 6 characters";
  }

  if (requireName && fields.password !== fields.confirmPassword) {
    return "Passwords do not match";
  }

  return "";
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
        Reward is useful only when it obeys direction. Lock the impulse. Finish
        the mission. Build the identity.
      </p>
      <div className="splash-actions">
        <Link className="button button-primary" to="/dashboard">
          Enter Dopamine Lock
        </Link>
        <Link className="button button-secondary" to="/login">
          Login
        </Link>
      </div>
    </main>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateAuthFields(form);

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setError("");
      setIsSubmitting(true);
      await login({ email: form.email, password: form.password });
      navigate("/dashboard", { replace: true });
    } catch (authError) {
      setError(authError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Login"
      subtitle="Return to the operating system."
      onSubmit={handleSubmit}
    >
      {error && <p className="form-error">{error}</p>}
      <Input
        label="Email"
        type="email"
        value={form.email}
        onChange={(event) => updateField("email", event.target.value)}
        placeholder="operator@dopaminelock.app"
      />
      <Input
        label="Password"
        type="password"
        value={form.password}
        onChange={(event) => updateField("password", event.target.value)}
        placeholder="Password"
      />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Logging In" : "Login"}
      </Button>
      <div className="auth-links">
        <Link to="/login">Forgot password</Link>
        <Link to="/register">Sign up</Link>
      </div>
    </AuthShell>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateAuthFields(form, true);

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setError("");
      setIsSubmitting(true);
      await register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
      });
      navigate("/dashboard", { replace: true });
    } catch (authError) {
      setError(authError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create Account"
      subtitle="Build a disciplined control profile."
      onSubmit={handleSubmit}
    >
      {error && <p className="form-error">{error}</p>}
      <Input
        label="Full name"
        value={form.fullName}
        onChange={(event) => updateField("fullName", event.target.value)}
        placeholder="Full name"
      />
      <Input
        label="Email"
        type="email"
        value={form.email}
        onChange={(event) => updateField("email", event.target.value)}
        placeholder="operator@dopaminelock.app"
      />
      <Input
        label="Password"
        type="password"
        value={form.password}
        onChange={(event) => updateField("password", event.target.value)}
        placeholder="Password"
      />
      <Input
        label="Confirm password"
        type="password"
        value={form.confirmPassword}
        onChange={(event) => updateField("confirmPassword", event.target.value)}
        placeholder="Confirm password"
      />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating Account" : "Create Account"}
      </Button>
      <div className="auth-links">
        <Link to="/login">Login</Link>
      </div>
    </AuthShell>
  );
}

function AuthShell({ title, subtitle, children, onSubmit }) {
  return (
    <main className="auth-screen">
      <Link className="brand-lock auth-brand" to="/">
        Dopamine Lock
      </Link>
      <form className="auth-card" onSubmit={onSubmit}>
        <p className="eyebrow">Access</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        <div className="form-stack">{children}</div>
      </form>
    </main>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: dashboardAnalytics } = useAnalytics(getDashboard);
  const { summary: achievementSummary } = useAchievements();
  const { summary: identitySummary } = useIdentity();
  const { review: dashboardWeeklyReview } = useWeeklyReview();
  const { review: dashboardMonthlyReview } = useMonthlyReview();
  const { effectiveRules } = useBlockManager();
  const { history: recentHistory } = useSessionHistory({
    limit: 3,
    page: 1,
    sort: "Newest",
  });
  const { missions: userMissions } = useMissions();
  const currentMission = dashboardAnalytics?.currentMission;
  const readyMission = userMissions.find(
    (mission) => mission.status === "Ready" && !mission.archived,
  );

  return (
    <>
      <PageHeader
        eyebrow="Daily Command"
        title="Discipline Dashboard"
        description={`Welcome back, ${user?.fullName || "Operator"}. Track the mission, protect attention, and keep the streak intact.`}
      />
      <div className="stats-grid">
        <StatCard
          label="Current Mission"
          value={
            currentMission
              ? formatClock(currentMission.remainingSeconds)
              : "None"
          }
          meta={
            currentMission?.title ||
            currentMission?.mission?.title ||
            "No Active Mission"
          }
          icon={Target}
        />
        <StatCard
          label="Active Blocked"
          value={effectiveRules?.blockedDomains?.length || 0}
          meta="Effective websites"
          icon={Ban}
        />
        <StatCard
          label="Allowed Websites"
          value={effectiveRules?.allowedDomains?.length || 0}
          meta="Effective access"
          icon={ShieldCheck}
        />
        <StatCard
          label="Active Goals"
          value={dashboardAnalytics?.goalSummary?.activeGoals || 0}
          meta={`${dashboardAnalytics?.goalSummary?.averageProgress || 0}% avg progress`}
          icon={Target}
        />
        <StatCard
          label="Discipline Score"
          value={`${dashboardAnalytics?.disciplineScore?.totalXp || 0} XP`}
          meta={`Rank ${dashboardAnalytics?.currentRank || "D"} - ${dashboardAnalytics?.disciplineScore?.progressPercentage || 0}%`}
          icon={Gauge}
        />
        <StatCard
          label="Current Streak"
          value={`${dashboardAnalytics?.currentStreak || 0} days`}
          meta={`Best: ${dashboardAnalytics?.bestStreak || 0}`}
          icon={Flame}
        />
        <StatCard
          label="Completion Rate"
          value={`${dashboardAnalytics?.quickStatistics?.completionRate || 0}%`}
          meta="Tracked days"
          icon={Activity}
        />
        <StatCard
          label="Next Milestone"
          value={dashboardAnalytics?.quickStatistics?.nextMilestone || 7}
          meta={`${dashboardAnalytics?.quickStatistics?.completionRate || 0}% consistency`}
          icon={Trophy}
        />
      </div>
      <div className="content-grid two-one">
        <Card title="Weekly Focus Chart" label="Hours locked">
          <MiniBarChart
            values={(dashboardAnalytics?.weeklyFocusHours || []).map(
              (item) => item.hours,
            )}
          />
        </Card>
        <Card title="Quick Actions" label="Next command">
          <div className="button-stack">
            <ActionLink onClick={() => navigate("/mission-center")}>
              Create Mission
            </ActionLink>
            <ActionLink
              onClick={() =>
                navigate(currentMission ? "/active-mission" : "/mission-center")
              }
            >
              {currentMission ? "Continue Mission" : "Start Mission"}
            </ActionLink>
            <ActionLink onClick={() => navigate("/mission-center")}>
              Mission Center
            </ActionLink>
            <ActionLink onClick={() => navigate("/streak-calendar")}>
              Streak Calendar
            </ActionLink>
            <ActionLink onClick={() => navigate("/discipline-score")}>
              Discipline Score
            </ActionLink>
            <ActionLink onClick={() => navigate("/goals")}>
              Goals Hub
            </ActionLink>
            {!currentMission && readyMission && (
              <ActionLink onClick={() => navigate("/mission-center")}>
                Continue Editing
              </ActionLink>
            )}
            <ActionLink onClick={() => navigate("/block-manager")}>
              Update Blocks
            </ActionLink>
          </div>
        </Card>
      </div>
      <Card
        title="Monthly Review Snapshot"
        label={dashboardMonthlyReview?.monthLabel || "Current month"}
        action={
          <Button
            variant="secondary"
            onClick={() => navigate("/monthly-review")}
          >
            Open Report
          </Button>
        }
      >
        <div className="review-grid compact-review">
          <ReviewStatCard
            label="Grade"
            value={dashboardMonthlyReview?.grade || "F"}
          />
          <ReviewStatCard
            label="Score"
            value={`${dashboardMonthlyReview?.overallScore || 0}/100`}
          />
          <ReviewStatCard
            label="Focus"
            value={`${dashboardMonthlyReview?.statistics?.totalFocusHours || 0}h`}
          />
          <ReviewStatCard
            label="Identity"
            value={
              dashboardMonthlyReview?.identity?.title || "Discipline Beginner"
            }
          />
        </div>
      </Card>
      <Card
        title="Weekly Review Snapshot"
        label={dashboardWeeklyReview?.week?.range || "Current week"}
        action={
          <Button
            variant="secondary"
            onClick={() => navigate("/weekly-review")}
          >
            Open Review
          </Button>
        }
      >
        <div className="review-grid compact-review">
          <ReviewStatCard
            label="Grade"
            value={dashboardWeeklyReview?.grade || "F"}
          />
          <ReviewStatCard
            label="Score"
            value={`${dashboardWeeklyReview?.overallScore || 0}/100`}
          />
          <ReviewStatCard
            label="Focus"
            value={`${dashboardWeeklyReview?.statistics?.focusHours || 0}h`}
          />
          <ReviewStatCard
            label="Success"
            value={`${dashboardWeeklyReview?.statistics?.missionSuccessRate || 0}%`}
          />
        </div>
      </Card>
      <Card
        title="Identity Summary"
        label="Who you are becoming"
        action={
          <Button variant="secondary" onClick={() => navigate("/identity")}>
            Open Identity
          </Button>
        }
      >
        <div className="review-grid compact-review">
          <ReviewStatCard
            label="Title"
            value={identitySummary?.currentTitle || "Discipline Beginner"}
          />
          <ReviewStatCard
            label="Score"
            value={`${identitySummary?.identityScore || 0}/100`}
          />
          <ReviewStatCard
            label="Tier"
            value={identitySummary?.currentTier || "STARTER"}
          />
          <ReviewStatCard
            label="Strongest Trait"
            value={identitySummary?.strongestTrait?.name || "None yet"}
          />
        </div>
      </Card>
      <Card
        title="Goal Progress Summary"
        label="Long-term outcomes"
        action={
          <Button variant="secondary" onClick={() => navigate("/goals")}>
            Open Goals Hub
          </Button>
        }
      >
        <div className="review-grid compact-review">
          <ReviewStatCard
            label="Active Goals"
            value={dashboardAnalytics?.goalSummary?.activeGoals || 0}
          />
          <ReviewStatCard
            label="Average Progress"
            value={`${dashboardAnalytics?.goalSummary?.averageProgress || 0}%`}
          />
          <ReviewStatCard
            label="Completed Goals"
            value={dashboardAnalytics?.goalSummary?.completedGoals || 0}
          />
          <ReviewStatCard
            label="Top Active Goal"
            value={
              dashboardAnalytics?.goalSummary?.topActiveGoal?.title || "None"
            }
          />
        </div>
      </Card>
      <Card
        title="Achievement Snapshot"
        label="Milestones unlocked"
        action={
          <Button variant="secondary" onClick={() => navigate("/achievements")}>
            View All
          </Button>
        }
      >
        <div className="review-grid compact-review">
          <ReviewStatCard
            label="Unlocked"
            value={achievementSummary?.unlocked || 0}
          />
          <ReviewStatCard
            label="Total"
            value={achievementSummary?.totalAchievements || 0}
          />
          <ReviewStatCard
            label="Completion"
            value={`${achievementSummary?.completionPercentage || 0}%`}
          />
          <ReviewStatCard
            label="XP Earned"
            value={`+${achievementSummary?.xpFromAchievements || 0}`}
          />
        </div>
      </Card>
      <Card
        title="Consumption Overview"
        label="Create more, consume less"
        action={
          <Button
            variant="secondary"
            onClick={() => navigate("/consumption-control")}
          >
            Manage Consumption
          </Button>
        }
      >
        <div className="review-grid compact-review">
          <ReviewStatCard
            label="Today's Focus"
            value={`${dashboardAnalytics?.todayFocus || 0}h`}
          />
          <ReviewStatCard
            label="Today's Sessions"
            value={dashboardAnalytics?.todaySessions || 0}
          />
          <ReviewStatCard
            label="Weekly Focus"
            value={`${(dashboardAnalytics?.weeklyFocusHours || []).reduce((sum, item) => sum + (item.hours || 0), 0).toFixed(1)}h`}
          />
          <ReviewStatCard
            label="Healthy Consumption"
            value={`${dashboardAnalytics?.todayConsumptionScore || 100}%`}
          />
        </div>
      </Card>
      <Card title="Recent Sessions" label="Last activity">
        <div className="list-stack">
          {recentHistory.items.map((session) => (
            <SessionCard
              key={session.id}
              session={sessionCardFromHistory(session)}
            />
          ))}
          {recentHistory.items.length === 0 && (
            <p className="muted-text">
              No completed or abandoned sessions yet.
            </p>
          )}
          <Button
            variant="secondary"
            onClick={() => navigate("/session-history")}
          >
            View All
          </Button>
        </div>
      </Card>
    </>
  );
}

export function ProfilePage() {
  const { refreshProfile, updateProfile, uploadAvatar, user } = useAuth();
  const { missions: userMissions } = useMissions();
  const { session: currentSession } = useMissionSession();
  const { summary: sessionSummary } = useSessionHistory({ limit: 1, page: 1 });
  const [profileCalendarDate] = useState(() => {
    const now = new Date();
    return {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    };
  });
  const { summary: profileStreakSummary } = useStreak(
    profileCalendarDate.month,
    profileCalendarDate.year,
  );
  const {
    summary: profileAchievementSummary,
    achievements: profileAchievements,
  } = useAchievements();
  const { summary: profileIdentitySummary } = useIdentity();
  const latestAchievement = profileAchievements
    .filter((a) => a.completed && a.unlockedAt)
    .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))[0];
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(() => profileFormFromUser(null));
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  useEffect(() => {
    refreshProfile().catch(() => setError("Unable to load profile"));
  }, [refreshProfile]);

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const beginEdit = () => {
    setForm(profileFormFromUser(user));
    setIsEditing(true);
    setError("");
    setSuccess("");
  };

  const validateProfile = () => {
    if (!form.fullName.trim()) {
      return "Name is required";
    }

    if (form.bio.length > bioLimit) {
      return `Bio must be ${bioLimit} characters or fewer`;
    }

    if (Number(form.dailyFocusGoal) <= 0) {
      return "Daily Goal must be a positive number";
    }

    if (Number(form.preferredMissionDuration) <= 0) {
      return "Preferred Mission Duration must be a positive number";
    }

    return "";
  };

  const handleSave = async () => {
    const validationError = validateProfile();

    if (validationError) {
      setError(validationError);
      setSuccess("");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      const profile = await updateProfile({
        fullName: form.fullName,
        bio: form.bio,
        timezone: form.timezone,
        dailyFocusGoal: Number(form.dailyFocusGoal),
        preferredMissionDuration: Number(form.preferredMissionDuration),
      });
      setSuccess("Profile updated");
      setIsEditing(false);
      setForm(profileFormFromUser(profile));
    } catch (saveError) {
      setError(saveError.message);
      setSuccess("");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError("");
    setSuccess("");
    setForm(profileFormFromUser(user));
  };

  const validateAvatarFile = (file) => {
    if (!file) {
      return "Choose an image to upload";
    }

    if (!avatarTypes.has(file.type)) {
      return "Only JPG, JPEG, PNG, and WEBP images are allowed";
    }

    if (file.size > avatarMaxSize) {
      return "Avatar image must be 2MB or smaller";
    }

    return "";
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    const validationError = validateAvatarFile(file);

    if (validationError) {
      setAvatarFile(null);
      setError(validationError);
      setSuccess("");
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
        setAvatarPreview("");
      }
      event.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarFile(file);
    setAvatarPreview(previewUrl);
    setError("");
    setSuccess("");
  };

  const handleAvatarSave = async () => {
    const validationError = validateAvatarFile(avatarFile);

    if (validationError) {
      setError(validationError);
      setSuccess("");
      return;
    }

    try {
      setIsUploadingAvatar(true);
      setError("");
      await uploadAvatar(avatarFile);
      await refreshProfile();
      setSuccess("Profile photo updated");
      setAvatarFile(null);
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
        setAvatarPreview("");
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (uploadError) {
      setError(uploadError.message);
      setSuccess("");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <>
      <section className="profile-hero">
        <UserAvatar user={user} size="lg" />
        <div>
          <p className="eyebrow">User Profile</p>
          <h2>{user?.fullName || "Operator"}</h2>
          <p>{profileIdentitySummary?.currentTitle || "Discipline Beginner"}</p>
          <span>{formatMemberSince(user?.createdAt)}</span>
        </div>
        <Badge label="Current Status: Active" />
      </section>

      {(error || success) && (
        <p className={error ? "form-error" : "form-success"}>
          {error || success}
        </p>
      )}

      <div className="content-grid split">
        <Card
          title="Profile Information"
          label="Authenticated data"
          action={
            !isEditing && (
              <Button variant="secondary" onClick={beginEdit}>
                Edit Profile
              </Button>
            )
          }
        >
          {!isEditing ? (
            <div className="profile-details">
              <ProfileDetail label="Full Name" value={user?.fullName} />
              <ProfileDetail label="Email" value={user?.email} />
              <ProfileDetail
                label="Discipline Title"
                value={user?.disciplineTitle}
              />
              <ProfileDetail label="Bio" value={user?.bio || "No bio set"} />
              <ProfileDetail
                label="Total Missions Created"
                value={userMissions.length}
              />
              <ProfileDetail
                label="Total Sessions"
                value={sessionSummary?.totalSessions || 0}
              />
              <ProfileDetail
                label="Completed Sessions"
                value={sessionSummary?.completedSessions || 0}
              />
              <ProfileDetail
                label="Average Focus Time"
                value={formatDuration(
                  sessionSummary?.averageSessionDuration || 0,
                )}
              />
              <ProfileDetail
                label="Current Streak"
                value={`${profileStreakSummary?.currentStreak || 0} days`}
              />
              <ProfileDetail
                label="Current Active Mission"
                value={currentSession?.mission?.title || "No active mission"}
              />
              <ProfileDetail
                label="Current Session Duration"
                value={
                  currentSession
                    ? formatDuration(currentSession.elapsedSeconds)
                    : "0m"
                }
              />
              <ProfileDetail
                label="Daily Goal"
                value={`${user?.dailyFocusGoal || 4} hours`}
              />
              <ProfileDetail
                label="Preferred Mission Duration"
                value={`${user?.preferredMissionDuration || 50} minutes`}
              />
              <ProfileDetail label="Timezone" value={user?.timezone} />
              <ProfileDetail
                label="Achievements Unlocked"
                value={profileAchievementSummary?.unlocked || 0}
              />
              <ProfileDetail
                label="Achievement Completion"
                value={`${profileAchievementSummary?.completionPercentage || 0}%`}
              />
              <ProfileDetail
                label="Latest Achievement"
                value={latestAchievement?.title || "None yet"}
              />
              <ProfileDetail
                label="Legendary Achievements"
                value={profileAchievementSummary?.legendaryUnlocked || 0}
              />
              <ProfileDetail
                label="XP from Achievements"
                value={`+${profileAchievementSummary?.xpFromAchievements || 0}`}
              />
            </div>
          ) : (
            <div className="form-stack">
              <Input
                label="Name"
                value={form.fullName}
                onChange={(event) =>
                  updateField("fullName", event.target.value)
                }
              />
              <label className="field">
                <span>Bio</span>
                <textarea
                  value={form.bio}
                  maxLength={bioLimit}
                  onChange={(event) => updateField("bio", event.target.value)}
                />
              </label>
              <Input
                label="Timezone"
                value={form.timezone}
                onChange={(event) =>
                  updateField("timezone", event.target.value)
                }
              />
              <Input
                label="Daily Goal"
                type="number"
                min="1"
                value={form.dailyFocusGoal}
                onChange={(event) =>
                  updateField("dailyFocusGoal", event.target.value)
                }
              />
              <Input
                label="Preferred Mission Duration"
                type="number"
                min="1"
                value={form.preferredMissionDuration}
                onChange={(event) =>
                  updateField("preferredMissionDuration", event.target.value)
                }
              />
              <div className="splash-actions">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving" : "Save"}
                </Button>
                <Button variant="secondary" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Card>
        <Card title="Profile Picture" label="Avatar">
          <div className="profile-avatar-card">
            <UserAvatar
              user={{ ...user, avatarUrl: avatarPreview || user?.avatarUrl }}
              size="lg"
            />
            <input
              ref={fileInputRef}
              className="avatar-file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
            />
            <div className="avatar-actions">
              <Button
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                Upload Photo
              </Button>
              <Button
                onClick={handleAvatarSave}
                disabled={!avatarFile || isUploadingAvatar}
              >
                {isUploadingAvatar ? "Saving Avatar" : "Save Avatar"}
              </Button>
            </div>
            {avatarFile && <p className="muted-text">{avatarFile.name}</p>}
          </div>
        </Card>
      </div>
    </>
  );
}

function ProfileDetail({ label, value }) {
  return (
    <div className="compact-row">
      <span>{label}</span>
      <strong>{value || "Not set"}</strong>
    </div>
  );
}

export function MissionCenterPage() {
  const navigate = useNavigate();
  const {
    error: loadError,
    isLoading,
    missions: userMissions,
    refreshMissions,
  } = useMissions();
  const { refreshSession, session: currentSession } = useMissionSession();
  const [form, setForm] = useState(() => ({ ...defaultMissionForm }));
  const [editingMissionId, setEditingMissionId] = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("Newest");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const filteredMissions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...userMissions]
      .filter((mission) => {
        if (filter === "Favorites") {
          return mission.favorite && !mission.archived;
        }

        if (filter === "Archived") {
          return mission.archived;
        }

        if (["Easy", "Medium", "Hard"].includes(filter)) {
          return mission.difficulty === filter && !mission.archived;
        }

        return !mission.archived;
      })
      .filter((mission) => {
        if (!normalizedQuery) {
          return true;
        }

        return [mission.title, mission.goal, mission.description]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedQuery));
      })
      .sort((a, b) => {
        if (sort === "Oldest") {
          return new Date(a.createdAt) - new Date(b.createdAt);
        }

        if (sort === "Alphabetical") {
          return a.title.localeCompare(b.title);
        }

        if (sort === "Duration") {
          return a.durationMinutes - b.durationMinutes;
        }

        if (sort === "Difficulty") {
          const weights = { Easy: 1, Medium: 2, Hard: 3 };
          return weights[a.difficulty] - weights[b.difficulty];
        }

        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }, [filter, query, sort, userMissions]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const validateMissionForm = () => {
    if (!form.title.trim()) {
      return "Mission title is required";
    }

    if (!form.goal.trim()) {
      return "Goal is required";
    }

    if (
      !Number.isFinite(Number(form.durationMinutes)) ||
      Number(form.durationMinutes) <= 0
    ) {
      return "Duration must be a positive number";
    }

    if (!["Easy", "Medium", "Hard"].includes(form.difficulty)) {
      return "Difficulty must be Easy, Medium, or Hard";
    }

    return "";
  };

  const resetForm = () => {
    setForm({ ...defaultMissionForm });
    setEditingMissionId(null);
    setError("");
    setSuccess("");
  };

  const handleSaveMission = async () => {
    const validationError = validateMissionForm();

    if (validationError) {
      setError(validationError);
      setSuccess("");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      const payload = missionPayloadFromForm(form);

      if (editingMissionId) {
        await updateMission(editingMissionId, payload);
        setSuccess("Mission updated");
      } else {
        await createMission(payload);
        setSuccess("Mission created");
      }

      await refreshMissions();
      setForm({ ...defaultMissionForm });
      setEditingMissionId(null);
    } catch (saveError) {
      setError(saveError.message);
      setSuccess("");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditMission = (mission) => {
    setForm(missionFormFromMission(mission));
    setEditingMissionId(mission.id);
    setError("");
    setSuccess("");
  };

  const handleMissionAction = async (action, successMessage) => {
    try {
      setError("");
      await action();
      await refreshMissions();
      setSuccess(successMessage);
    } catch (actionError) {
      setError(actionError.message);
      setSuccess("");
    }
  };

  const handleStartMission = async (mission) => {
    try {
      setError("");
      await startMission(mission.id);
      await refreshSession();
      setSuccess("Mission started");
      navigate("/active-mission");
    } catch (startError) {
      setError(startError.message);
      setSuccess("");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Mission Center"
        title="Create Focus Mission"
        description="Define the objective, constraints, and resistance protocol."
      />
      {(error || loadError || success) && (
        <p className={error || loadError ? "form-error" : "form-success"}>
          {error || loadError || success}
        </p>
      )}
      {currentSession && (
        <p className="form-error">
          Finish your current mission before starting another.
        </p>
      )}
      <div className="content-grid split">
        <Card title="Create Mission Form" label="Mission design">
          <div className="form-grid">
            <Input
              label="Mission name"
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="Deep Work: DSA Blocks"
            />
            <Input
              label="Goal"
              value={form.goal}
              onChange={(event) => updateField("goal", event.target.value)}
              placeholder="Complete graph traversal drills"
            />
            <Input
              label="Duration"
              type="number"
              min="1"
              value={form.durationMinutes}
              onChange={(event) =>
                updateField("durationMinutes", event.target.value)
              }
              placeholder="90 minutes"
            />
            <Select
              label="Difficulty"
              value={form.difficulty}
              onChange={(event) =>
                updateField("difficulty", event.target.value)
              }
            >
              {["Easy", "Medium", "Hard"].map((difficulty) => (
                <option key={difficulty}>{difficulty}</option>
              ))}
            </Select>
            <label className="field form-span-full">
              <span>Description</span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                placeholder="Optional mission context"
              />
            </label>
            <Input
              label="Blocked websites"
              value={form.blockedWebsites}
              onChange={(event) =>
                updateField("blockedWebsites", event.target.value)
              }
              placeholder="youtube.com, x.com"
            />
            <Input
              label="Allowed websites"
              value={form.allowedWebsites}
              onChange={(event) =>
                updateField("allowedWebsites", event.target.value)
              }
              placeholder="leetcode.com, github.com"
            />
            <Input
              label="Blocked categories"
              value={form.blockedCategories}
              onChange={(event) =>
                updateField("blockedCategories", event.target.value)
              }
              placeholder="Social, Video, Gaming"
            />
            <Select
              label="Status"
              value={form.status}
              onChange={(event) => updateField("status", event.target.value)}
            >
              {["Draft", "Ready"].map((status) => (
                <option key={status}>{status}</option>
              ))}
            </Select>
          </div>
          <div className="toggle-list">
            <label>
              <input
                type="checkbox"
                checked={form.strictMode}
                onChange={(event) =>
                  updateField("strictMode", event.target.checked)
                }
              />{" "}
              Strict Mode
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.blockNotifications}
                onChange={(event) =>
                  updateField("blockNotifications", event.target.checked)
                }
              />{" "}
              Block Notifications
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.preventTabSwitching}
                onChange={(event) =>
                  updateField("preventTabSwitching", event.target.checked)
                }
              />{" "}
              Prevent Tab Switching
            </label>
          </div>
          <div className="splash-actions">
            <Button onClick={handleSaveMission} disabled={isSaving}>
              <Plus size={15} />
              {isSaving
                ? "Saving Mission"
                : editingMissionId
                  ? "Save Mission"
                  : "Create Mission"}
            </Button>
            <Button variant="secondary" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </Card>
        <Card
          title="Mission List"
          label={
            isLoading ? "Loading missions" : `${filteredMissions.length} shown`
          }
        >
          <div className="form-grid mission-controls">
            <Input
              label="Search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search missions"
            />
            <Select
              label="Filter"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              {missionFilters.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
            <Select
              label="Sort"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              {missionSorts.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
          </div>
          <div className="list-stack">
            {filteredMissions.map((mission) => (
              <MissionListItem
                key={mission.id}
                mission={mission}
                onArchive={() =>
                  handleMissionAction(
                    () => archiveMission(mission.id, !mission.archived),
                    mission.archived ? "Mission restored" : "Mission archived",
                  )
                }
                onDelete={() =>
                  handleMissionAction(
                    () => deleteMission(mission.id),
                    "Mission deleted",
                  )
                }
                onEdit={() => handleEditMission(mission)}
                onFavorite={() =>
                  handleMissionAction(
                    () => toggleFavorite(mission.id),
                    "Favorite updated",
                  )
                }
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
        <div className="badge-row">
          {missionRules.map((rule) => (
            <Badge key={rule} label={rule} />
          ))}
        </div>
      </Card>
    </>
  );
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
          <Badge
            label={mission.status}
            tone={mission.archived ? "muted" : "default"}
          />
        </div>
      </div>
      <div className="mission-list-meta">
        <span>{mission.durationMinutes} minutes</span>
        <span>Created {formatDate(mission.createdAt)}</span>
      </div>
      <div className="mission-actions">
        <Button disabled={startDisabled} onClick={onStart}>
          <Play size={15} />
          Start Mission
        </Button>
        <Button variant="secondary" onClick={onEdit}>
          <Edit3 size={15} />
          Edit
        </Button>
        <Button variant="secondary" onClick={onFavorite}>
          <Star size={15} />
          {mission.favorite ? "Unfavorite" : "Favorite"}
        </Button>
        <Button variant="secondary" onClick={onArchive}>
          <Archive size={15} />
          {mission.archived ? "Restore" : "Archive"}
        </Button>
        <Button variant="danger" onClick={onDelete}>
          <Trash2 size={15} />
          Delete
        </Button>
      </div>
    </article>
  );
}

export function ActiveMissionPage() {
  const navigate = useNavigate();
  const { effectiveRules } = useBlockManager();
  const {
    error: loadError,
    isLoading,
    refreshSession,
    session,
  } = useMissionSession();
  const [clockNow, setClockNow] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const sessionId = session?.id;
  const sessionStatus = session?.status;

  const liveSession = useMemo(() => {
    if (!session || session.status !== "ACTIVE") {
      return session;
    }

    const serverNow = session.serverNow
      ? new Date(session.serverNow).getTime()
      : 0;
    const tickDelta =
      clockNow && serverNow
        ? Math.max(0, Math.floor((clockNow - serverNow) / 1000))
        : 0;
    const elapsedSeconds = session.elapsedSeconds + tickDelta;
    const remainingSeconds = Math.max(0, session.remainingSeconds - tickDelta);
    const totalSeconds = elapsedSeconds + remainingSeconds;
    const completionPercentage =
      totalSeconds > 0
        ? Math.min(100, Math.round((elapsedSeconds / totalSeconds) * 100))
        : session.completionPercentage;

    return {
      ...session,
      completionPercentage,
      elapsedSeconds,
      remainingSeconds,
    };
  }, [clockNow, session]);
  const mission = liveSession?.mission;
  const effectiveBlockedDomains = effectiveRules?.blockedDomains || [];
  const effectiveAllowedDomains = effectiveRules?.allowedDomains || [];

  useEffect(() => {
    if (sessionStatus !== "ACTIVE") {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setClockNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [sessionId, sessionStatus]);

  const handleSessionAction = async (action, successMessage) => {
    try {
      setError("");
      await action();
      await refreshSession();
      setSuccess(successMessage);
    } catch (actionError) {
      setError(actionError.message);
      setSuccess("");
    }
  };

  if (isLoading) {
    return <p className="route-loading">Loading active mission</p>;
  }

  if (!liveSession || !mission) {
    return (
      <>
        <PageHeader
          eyebrow="Active Mission"
          title="No Active Mission"
          description="Start a mission from Mission Center to begin a focus session."
        />
        {(loadError || error || success) && (
          <p className={loadError || error ? "form-error" : "form-success"}>
            {loadError || error || success}
          </p>
        )}
        <Card className="mission-hero">
          <p className="eyebrow">Mission Timer</p>
          <strong>00:00:00</strong>
          <span>No active mission</span>
          <ProgressBar value={0} />
        </Card>
        <Button onClick={() => navigate("/mission-center")}>
          <Play size={15} />
          Start Mission
        </Button>
      </>
    );
  }

  const rules = [
    { label: "Strict Mode", enabled: mission.strictMode },
    { label: "Block Notifications", enabled: mission.blockNotifications },
    { label: "Prevent Tab Switching", enabled: mission.preventTabSwitching },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Active Mission"
        title={mission.title}
        description={mission.goal}
      />
      {(loadError || error || success) && (
        <p className={loadError || error ? "form-error" : "form-success"}>
          {loadError || error || success}
        </p>
      )}
      <Card className="mission-hero">
        <p className="eyebrow">Mission Timer</p>
        <strong>{formatClock(liveSession.remainingSeconds)}</strong>
        <span>
          {formatDuration(liveSession.elapsedSeconds)} elapsed -{" "}
          {liveSession.status}
        </span>
        <ProgressBar value={liveSession.completionPercentage} />
      </Card>
      <div className="stats-grid">
        <StatCard
          label="Progress"
          value={`${liveSession.completionPercentage}%`}
          meta={mission.difficulty}
          icon={Gauge}
        />
        <StatCard
          label="Elapsed Time"
          value={formatDuration(liveSession.elapsedSeconds)}
          meta={`Started ${formatTime(liveSession.startedAt)}`}
          icon={Clock}
        />
        <StatCard
          label="Remaining"
          value={formatDuration(liveSession.remainingSeconds)}
          meta={
            liveSession.estimatedFinishAt
              ? `Ends ${formatTime(liveSession.estimatedFinishAt)}`
              : "Paused"
          }
          icon={Target}
        />
        <StatCard
          label="Blocked Categories"
          value={mission.blockedCategories.length}
          meta={mission.blockedCategories.join(", ") || "None"}
          icon={Lock}
        />
      </div>
      <div className="content-grid split">
        <Card title="Mission Rules" label="Enforced">
          <div className="list-stack">
            {rules.map((rule) => (
              <div className="compact-row" key={rule.label}>
                <span>{rule.label}</span>
                <Badge label={rule.enabled ? "On" : "Off"} />
              </div>
            ))}
          </div>
        </Card>
        <Card title="Blocked Websites" label="Impulse perimeter">
          <div className="badge-row">
            {[
              ...new Set([
                ...effectiveBlockedDomains,
                ...mission.blockedWebsites,
              ]),
            ].length > 0 ? (
              [
                ...new Set([
                  ...effectiveBlockedDomains,
                  ...mission.blockedWebsites,
                ]),
              ].map((site) => <Badge key={site} label={site} />)
            ) : (
              <p className="muted-text">No blocked websites set.</p>
            )}
          </div>
        </Card>
      </div>
      <div className="content-grid split">
        <Card title="Allowed Websites" label="Permitted">
          <div className="badge-row">
            {[
              ...new Set([
                ...effectiveAllowedDomains,
                ...mission.allowedWebsites,
              ]),
            ].length > 0 ? (
              [
                ...new Set([
                  ...effectiveAllowedDomains,
                  ...mission.allowedWebsites,
                ]),
              ].map((site) => <Badge key={site} label={site} />)
            ) : (
              <p className="muted-text">No allowed websites set.</p>
            )}
          </div>
        </Card>
        <Card title="Session State" label="Recovery data">
          <div className="profile-details">
            <ProfileDetail label="Current Status" value={liveSession.status} />
            <ProfileDetail
              label="Started Time"
              value={formatTime(liveSession.startedAt)}
            />
            <ProfileDetail
              label="Estimated Finish"
              value={
                liveSession.estimatedFinishAt
                  ? formatTime(liveSession.estimatedFinishAt)
                  : "Paused"
              }
            />
          </div>
        </Card>
      </div>
      <div className="splash-actions">
        {liveSession.status === "ACTIVE" ? (
          <Button
            variant="secondary"
            onClick={() => handleSessionAction(pauseMission, "Mission paused")}
          >
            <Pause size={15} />
            Pause
          </Button>
        ) : (
          <Button
            onClick={() =>
              handleSessionAction(resumeMission, "Mission resumed")
            }
          >
            <Play size={15} />
            Resume
          </Button>
        )}
        <Button
          disabled={liveSession.status === "PAUSED"}
          onClick={() =>
            handleSessionAction(completeMission, "Mission completed")
          }
        >
          <CheckCircle2 size={15} />
          Complete Mission
        </Button>
        <Button
          variant="danger"
          onClick={() =>
            handleSessionAction(abandonMission, "Mission abandoned")
          }
        >
          <Ban size={15} />
          Abandon Mission
        </Button>
      </div>
    </>
  );
}

export function ConsumptionControlPage() {
  const navigate = useNavigate();
  const {
    error: loadError,
    limits,
    platforms,
    refreshConsumption,
    summary,
    timeline,
    weekly,
  } = useConsumption();
  const [limitForm, setLimitForm] = useState({
    maxMinutesPerDay: 120,
    maxVideosPerDay: 40,
    strictLockMode: true,
    warningThreshold: 80,
  });
  const [logForm, setLogForm] = useState(() => ({
    ...defaultConsumptionLogForm,
  }));
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [limitTouched, setLimitTouched] = useState(false);
  const timelineValues = timeline.length
    ? timeline.map((item) => item.totalVideos)
    : [0, 0, 0, 0, 0, 0, 0];
  const activeLimitForm = limitTouched
    ? limitForm
    : {
        maxMinutesPerDay:
          limits?.global?.maxMinutesPerDay || limitForm.maxMinutesPerDay,
        maxVideosPerDay:
          limits?.global?.maxVideosPerDay || limitForm.maxVideosPerDay,
        strictLockMode:
          limits?.global?.strictLockMode ?? limitForm.strictLockMode,
        warningThreshold:
          limits?.global?.warningThreshold || limitForm.warningThreshold,
      };
  const activePlatformSlug = logForm.platformSlug || platforms[0]?.slug || "";

  const updateLimit = (key, value) => {
    setLimitTouched(true);
    setLimitForm((current) => ({ ...current, [key]: value }));
  };

  const updateLogField = (key, value) => {
    setLogForm((current) => ({ ...current, [key]: value }));
  };

  async function handleLimitSave() {
    try {
      setIsSaving(true);
      setMessage("");
      await updateConsumptionLimits({
        global: {
          maxMinutesPerDay: Number(activeLimitForm.maxMinutesPerDay),
          maxVideosPerDay: Number(activeLimitForm.maxVideosPerDay),
          strictLockMode: activeLimitForm.strictLockMode,
          warningThreshold: Number(activeLimitForm.warningThreshold),
        },
      });
      await refreshConsumption();
      setLimitTouched(false);
      setMessage("Consumption limits updated.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogSubmit(event) {
    event.preventDefault();

    try {
      setIsSaving(true);
      setMessage("");
      await createConsumptionLog({
        minutesConsumed: Number(logForm.minutesConsumed),
        platformSlug: activePlatformSlug,
        videosWatched: Number(logForm.videosWatched),
      });
      setLogForm((current) => ({
        ...defaultConsumptionLogForm,
        platformSlug: current.platformSlug,
      }));
      await refreshConsumption();
      setMessage("Consumption log added.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      {loadError && <p className="form-message form-error">{loadError}</p>}
      {message && (
        <p
          className={`form-message ${message.includes("updated") || message.includes("added") ? "form-success" : "form-error"}`}
        >
          {message}
        </p>
      )}
      <section className="consumption-hero">
        <div>
          <p className="eyebrow">Consumption Control</p>
          <h2>Consumption Control</h2>
          <p>
            Track, understand, and limit short-form content before it controls
            your attention.
          </p>
        </div>
        <Card className="daily-score-card">
          <p className="eyebrow">Daily Consumption Score</p>
          <strong>{summary?.dailyConsumptionScore ?? 100} / 100</strong>
          <Badge
            label={summary?.statusText || "Healthy Consumption"}
            tone={
              summary?.limitReached
                ? "danger"
                : summary?.warningReached
                  ? "muted"
                  : "default"
            }
          />
        </Card>
      </section>

      <div className="stats-grid">
        <StatCard
          label="Today's Reels"
          value={summary?.todaysReels || 0}
          icon={Smartphone}
        />
        <StatCard
          label="Today's Shorts"
          value={summary?.todaysShorts || 0}
          icon={TimerReset}
        />
        <StatCard
          label="Time Consumed"
          value={summary?.timeConsumed || "0m"}
          icon={Clock}
        />
        <StatCard
          label="Daily Limit Remaining"
          value={summary?.dailyLimitRemaining || "0 Videos"}
          icon={ShieldCheck}
        />
      </div>

      <section className="panel-section">
        <div className="card-head">
          <div>
            <p className="eyebrow">Short-form sources</p>
            <h3>Platform Usage</h3>
          </div>
        </div>
        <div className="platform-grid">
          {platforms.map((platform) => (
            <PlatformUsageCard key={platform.id} platform={platform} />
          ))}
          {platforms.length === 0 && (
            <p className="muted-text">No consumption platforms configured.</p>
          )}
        </div>
      </section>

      <div className="content-grid split">
        <Card title="Consumption Timeline" label="Last 7 days">
          <LineChartMock values={timelineValues} />
          <div className="chart-labels">
            {timeline.map((item) => (
              <span key={item.day}>{item.day.slice(0, 3)}</span>
            ))}
          </div>
        </Card>
        <Card title="Daily Limit Manager" label="Backend limits">
          <div className="form-grid">
            <Input
              label="Maximum videos per day"
              type="number"
              value={activeLimitForm.maxVideosPerDay}
              onChange={(event) =>
                updateLimit("maxVideosPerDay", event.target.value)
              }
            />
            <Input
              label="Maximum total watch time"
              type="number"
              value={activeLimitForm.maxMinutesPerDay}
              onChange={(event) =>
                updateLimit("maxMinutesPerDay", event.target.value)
              }
            />
          </div>
          <label className="compact-row strict-toggle">
            <span>Strict Lock Mode</span>
            <input
              type="checkbox"
              checked={activeLimitForm.strictLockMode}
              onChange={(event) =>
                updateLimit("strictLockMode", event.target.checked)
              }
            />
          </label>
          {activeLimitForm.strictLockMode && (
            <p className="muted-text">
              When your limit is reached, Dopamine Lock blocks further access
              until tomorrow.
            </p>
          )}
          <Button onClick={handleLimitSave} disabled={isSaving}>
            Save Limits
          </Button>
        </Card>
      </div>

      <div className="content-grid split">
        <Card title="Warning Threshold" label="Limit alerts">
          <Select
            label="Choose threshold"
            value={activeLimitForm.warningThreshold}
            onChange={(event) =>
              updateLimit("warningThreshold", event.target.value)
            }
          >
            <option value="50">50%</option>
            <option value="75">75%</option>
            <option value="90">90%</option>
            <option value="100">100%</option>
          </Select>
          <p className="warning-preview">
            You have consumed {activeLimitForm.warningThreshold}% of today's
            reel limit.
          </p>
        </Card>
        <Card title="Weekly Analytics" label="Consumption reduction">
          <div className="review-grid compact-review">
            <ReviewStatCard
              label="Average Daily Consumption"
              value={weekly?.averageDailyConsumption || "0 videos"}
            />
            <ReviewStatCard
              label="Videos Avoided"
              value={weekly?.videosAvoided || 0}
            />
            <ReviewStatCard
              label="Estimated Time Saved"
              value={weekly?.estimatedTimeSaved || "0m"}
            />
            <ReviewStatCard
              label="Focus Hours Gained"
              value={weekly?.focusHoursGained || "0.0h"}
            />
          </div>
        </Card>
      </div>

      <Card title="Add Consumption Log" label="Manual entry">
        <form className="form-grid" onSubmit={handleLogSubmit}>
          <Select
            label="Platform"
            value={activePlatformSlug}
            onChange={(event) =>
              updateLogField("platformSlug", event.target.value)
            }
          >
            {platforms.map((platform) => (
              <option key={platform.slug} value={platform.slug}>
                {platform.platformName}
              </option>
            ))}
          </Select>
          <Input
            label="Videos Watched"
            type="number"
            min="0"
            value={logForm.videosWatched}
            onChange={(event) =>
              updateLogField("videosWatched", event.target.value)
            }
          />
          <Input
            label="Minutes Consumed"
            type="number"
            min="0"
            value={logForm.minutesConsumed}
            onChange={(event) =>
              updateLogField("minutesConsumed", event.target.value)
            }
          />
          <Button disabled={isSaving} type="submit">
            Add Log
          </Button>
        </form>
      </Card>

      <Card
        title="Dopamine Awareness"
        label="Educational brief"
        className="awareness-card"
      >
        <p>
          Short-form content trains the brain to seek constant novelty. Reducing
          excessive consumption improves focus, memory, discipline, and deep
          work by lowering the demand for rapid reward switching.
        </p>
      </Card>

      <Card
        title="Healthy Habits Suggestions"
        label="Instead of watching reels"
      >
        <div className="habit-grid">
          {[
            { label: "Read 10 pages", icon: BookOpen },
            { label: "Take a short walk", icon: Activity },
            { label: "Complete a Focus Mission", icon: Target },
            { label: "Review notes", icon: CheckCircle2 },
            { label: "Continue coding", icon: Code2 },
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
          <Button onClick={() => navigate("/mission-center")}>
            Start Focus Mission
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate("/block-manager")}
          >
            Manage Website Blocking
          </Button>
          <Button variant="secondary" onClick={() => navigate("/analytics")}>
            View Analytics
          </Button>
          <Button variant="danger">
            <RefreshCcw size={15} />
            Reset Daily Limits
          </Button>
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
  );
}

export function BlockManagerPage() {
  const {
    error: loadError,
    isLoading,
    presets,
    refreshBlockManager,
    rules,
  } = useBlockManager();
  const [form, setForm] = useState(() => ({ ...defaultBlockRuleForm }));
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const activePresets = presets.filter((preset) => preset.enabled);
  const filteredRules = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return rules.filter((rule) => {
      const matchesSearch =
        !normalizedQuery ||
        rule.domain.includes(normalizedQuery) ||
        blockCategoryLabels[rule.category]
          .toLowerCase()
          .includes(normalizedQuery) ||
        (rule.reason || "").toLowerCase().includes(normalizedQuery);
      const matchesCategory =
        categoryFilter === "All" || rule.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [categoryFilter, query, rules]);
  const blocked = filteredRules.filter((rule) => rule.type === "BLOCKED");
  const allowed = filteredRules.filter((rule) => rule.type === "ALLOWED");

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleAddRule = async () => {
    try {
      setError("");
      await createRule(form);
      await refreshBlockManager();
      setForm({ ...defaultBlockRuleForm });
      setSuccess("Block rule added");
    } catch (ruleError) {
      setError(ruleError.message);
      setSuccess("");
    }
  };

  const handleRuleAction = async (action, successMessage) => {
    try {
      setError("");
      await action();
      await refreshBlockManager();
      setSuccess(successMessage);
    } catch (actionError) {
      setError(actionError.message);
      setSuccess("");
    }
  };

  const handlePresetAction = async (preset) => {
    await handleRuleAction(
      () =>
        preset.enabled ? disablePreset(preset.id) : enablePreset(preset.id),
      preset.enabled ? "Preset disabled" : "Preset enabled",
    );
  };

  return (
    <>
      <PageHeader
        eyebrow="Block Manager"
        title="Control Digital Access"
        description="Manage the websites and categories allowed during discipline windows."
      />
      {(error || loadError || success) && (
        <p className={error || loadError ? "form-error" : "form-success"}>
          {error || loadError || success}
        </p>
      )}
      <div className="toolbar">
        <Input
          label="Search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search domains or categories"
        />
        <Select
          label="Category filter"
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
        >
          <option>All</option>
          {blockCategories.map((category) => (
            <option key={category} value={category}>
              {blockCategoryLabels[category]}
            </option>
          ))}
        </Select>
      </div>
      <Card title="Add Website Rule" label="Custom access">
        <div className="form-grid">
          <Input
            label="Domain"
            value={form.domain}
            onChange={(event) => updateField("domain", event.target.value)}
            placeholder="youtube.com"
          />
          <Select
            label="Type"
            value={form.type}
            onChange={(event) => updateField("type", event.target.value)}
          >
            <option value="BLOCKED">Blocked</option>
            <option value="ALLOWED">Allowed</option>
          </Select>
          <Select
            label="Category"
            value={form.category}
            onChange={(event) => updateField("category", event.target.value)}
          >
            {blockCategories.map((category) => (
              <option key={category} value={category}>
                {blockCategoryLabels[category]}
              </option>
            ))}
          </Select>
          <Input
            label="Reason"
            value={form.reason}
            onChange={(event) => updateField("reason", event.target.value)}
            placeholder="Optional reason"
          />
        </div>
        <Button onClick={handleAddRule}>
          <Plus size={15} />
          Add Custom
        </Button>
      </Card>
      <div className="content-grid split">
        <Card
          title="Blocked Websites List"
          label={isLoading ? "Loading" : `${blocked.length} denied`}
        >
          <WebsiteList
            danger
            items={blocked}
            onDelete={(rule) =>
              handleRuleAction(() => deleteBlockRule(rule.id), "Rule deleted")
            }
            onToggle={(rule) =>
              handleRuleAction(() => toggleBlockRule(rule.id), "Rule updated")
            }
          />
        </Card>
        <Card
          title="Allowed Websites List"
          label={isLoading ? "Loading" : `${allowed.length} permitted`}
        >
          <WebsiteList
            items={allowed}
            onDelete={(rule) =>
              handleRuleAction(() => deleteBlockRule(rule.id), "Rule deleted")
            }
            onToggle={(rule) =>
              handleRuleAction(() => toggleBlockRule(rule.id), "Rule updated")
            }
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
                <Button
                  variant={preset.enabled ? "danger" : "secondary"}
                  onClick={() => handlePresetAction(preset)}
                >
                  {preset.enabled ? "Disable" : "Enable"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card title="Presets" label="Category badges">
        <div className="badge-row">
          {blockCategories.map((category) => (
            <Badge key={category} label={blockCategoryLabels[category]} />
          ))}
        </div>
      </Card>
    </>
  );
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
            <Badge
              label={blockCategoryLabels[item.category]}
              tone={danger ? "danger" : "default"}
            />
            <Badge
              label={item.active ? "Active" : "Inactive"}
              tone={item.active ? "default" : "muted"}
            />
            <Button variant="secondary" onClick={() => onToggle(item)}>
              {item.active ? "Disable" : "Enable"}
            </Button>
            <Button variant="danger" onClick={() => onDelete(item)}>
              Delete
            </Button>
          </div>
        </div>
      ))}
      {items.length === 0 && (
        <p className="muted-text">No websites match this view.</p>
      )}
    </div>
  );
}

export function SessionHistoryPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sort, setSort] = useState("Newest");
  const [error, setError] = useState("");
  const {
    error: loadError,
    history,
    isLoading,
    summary,
  } = useSessionHistory({
    filter,
    limit: 10,
    page,
    search: debouncedQuery,
    sort,
  });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  const grouped = useMemo(
    () =>
      history.items.reduce((groups, session) => {
        const group = sessionTimelineGroup(session.endedAt);
        groups[group] = [...(groups[group] || []), session];
        return groups;
      }, {}),
    [history.items],
  );

  const handleSelectSession = async (sessionId) => {
    try {
      setError("");
      setSelectedSession(await getHistorySession(sessionId));
    } catch (selectError) {
      setError(selectError.message);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Session History"
        title="Audit Focus Sessions"
        description="Search the timeline and inspect completion quality."
      />
      {(error || loadError) && (
        <p className="form-error">{error || loadError}</p>
      )}
      <div className="stats-grid">
        <StatCard
          label="Total Focus Hours"
          value={`${summary?.totalFocusHours || 0}h`}
          meta="Historical total"
          icon={Clock}
        />
        <StatCard
          label="Total Sessions"
          value={summary?.totalSessions || 0}
          meta={`${summary?.currentWeekSessions || 0} this week`}
          icon={Target}
        />
        <StatCard
          label="Success Rate"
          value={`${summary?.successRate || 0}%`}
          meta={`${summary?.completedSessions || 0} completed`}
          icon={CheckCircle2}
        />
        <StatCard
          label="Average Duration"
          value={formatDuration(summary?.averageSessionDuration || 0)}
          meta="Per session"
          icon={Trophy}
        />
      </div>
      <div className="toolbar">
        <Input
          label="Search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search sessions"
        />
        <Select
          label="Filters"
          value={filter}
          onChange={(event) => {
            setFilter(event.target.value);
            setPage(1);
          }}
        >
          {sessionFilters.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </Select>
        <Select
          label="Sort"
          value={sort}
          onChange={(event) => {
            setSort(event.target.value);
            setPage(1);
          }}
        >
          {sessionSorts.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </Select>
      </div>
      {Object.entries(grouped).map(([date, dateSessions]) => (
        <Card title={date} label="Timeline grouped by date" key={date}>
          <div className="list-stack">
            {dateSessions.map((session) => (
              <div className="compact-row" key={session.id}>
                <SessionCard session={sessionCardFromHistory(session)} />
                <Button
                  variant="secondary"
                  onClick={() => handleSelectSession(session.id)}
                >
                  Details
                </Button>
              </div>
            ))}
          </div>
        </Card>
      ))}
      {!isLoading && history.items.length === 0 && (
        <Card title="No Sessions" label="History">
          <p className="muted-text">
            No completed or abandoned sessions match this view.
          </p>
        </Card>
      )}
      <div className="splash-actions">
        <Button
          variant="secondary"
          disabled={page <= 1}
          onClick={() => setPage((current) => Math.max(1, current - 1))}
        >
          Previous
        </Button>
        <Badge label={`Page ${history.page} / ${history.totalPages}`} />
        <Button
          variant="secondary"
          disabled={page >= history.totalPages}
          onClick={() => setPage((current) => current + 1)}
        >
          Next
        </Button>
      </div>
      {selectedSession && (
        <Card title="Session Details" label={selectedSession.status}>
          <div className="profile-details">
            <ProfileDetail
              label="Mission Name"
              value={selectedSession.mission?.title}
            />
            <ProfileDetail label="Goal" value={selectedSession.mission?.goal} />
            <ProfileDetail
              label="Description"
              value={selectedSession.mission?.description || "No description"}
            />
            <ProfileDetail
              label="Duration"
              value={`${selectedSession.plannedDurationMinutes || selectedSession.mission?.durationMinutes || 0} minutes planned`}
            />
            <ProfileDetail
              label="Actual Duration"
              value={`${selectedSession.actualDurationMinutes || Math.round(selectedSession.elapsedSeconds / 60)} minutes`}
            />
            <ProfileDetail
              label="Completion Status"
              value={selectedSession.status}
            />
            <ProfileDetail
              label="Blocked Websites"
              value={
                (selectedSession.mission?.blockedWebsites || []).join(", ") ||
                "None"
              }
            />
            <ProfileDetail
              label="Started At"
              value={formatDateTime(selectedSession.startedAt)}
            />
            <ProfileDetail
              label="Ended At"
              value={formatDateTime(selectedSession.endedAt)}
            />
            <ProfileDetail
              label="Completion Reason"
              value={selectedSession.completionReason || "Not set"}
            />
            <ProfileDetail
              label="Notes"
              value={selectedSession.notes || "No notes"}
            />
          </div>
        </Card>
      )}
    </>
  );
}

export function StreakCalendarPage() {
  const [calendarDate, setCalendarDate] = useState(() => {
    const now = new Date();
    return {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    };
  });
  const { calendar, error, milestones, summary, weekly } = useStreak(
    calendarDate.month,
    calendarDate.year,
  );
  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(calendarDate.year, calendarDate.month - 1, 1));
  const nextMilestone =
    milestones.find((milestone) => !milestone.unlocked) ||
    milestones[milestones.length - 1];

  const moveMonth = (amount) => {
    setCalendarDate((current) => {
      const date = new Date(current.year, current.month - 1 + amount, 1);
      return {
        month: date.getMonth() + 1,
        year: date.getFullYear(),
      };
    });
  };

  return (
    <>
      <PageHeader
        eyebrow="Streak Calendar"
        title="Consistency Record"
        description="Completed, missed, partial, and today states across the month."
      />
      {error && <p className="form-error">{error}</p>}
      <div className="stats-grid">
        <StatCard
          label="Current Streak"
          value={`${summary?.currentStreak || 0} days`}
          meta={`Next milestone: ${summary?.nextMilestone || 7}`}
          icon={Flame}
        />
        <StatCard
          label="Best Streak"
          value={`${summary?.bestStreak || 0} days`}
          meta="Personal record"
          icon={Trophy}
        />
        <StatCard
          label="Completion Rate"
          value={`${summary?.completionRate || 0}%`}
          meta={`${summary?.totalCompletedDays || 0}/${summary?.totalTrackedDays || 0} tracked days`}
          icon={Activity}
        />
      </div>
      <Card
        title="Monthly Calendar Grid"
        label={monthLabel}
        action={
          <div className="splash-actions">
            <Button variant="secondary" onClick={() => moveMonth(-1)}>
              Previous
            </Button>
            <Button variant="secondary" onClick={() => moveMonth(1)}>
              Next
            </Button>
          </div>
        }
      >
        <CalendarGrid days={calendar.days} />
      </Card>
      <Card title="Weekly Consistency" label="Current week">
        <ProgressBar value={weekly?.percentage || 0} />
        <p className="muted-text">
          {weekly?.completedDays || 0} of {weekly?.totalDays || 7} days
          completed this week.
        </p>
      </Card>
      <Card
        title="Next Milestone"
        label={nextMilestone?.title || "7-Day Streak"}
      >
        <ProgressBar value={summary?.milestoneProgress || 0} />
        <p className="muted-text">
          {summary?.currentStreak || 0} of {summary?.nextMilestone || 7} days
          completed.
        </p>
      </Card>
    </>
  );
}

export function DisciplineScorePage() {
  const { breakdown, error, events, isLoading, refreshScore, score, trend } =
    useDisciplineScore();
  const [actionMessage, setActionMessage] = useState("");
  const [isRecalculating, setIsRecalculating] = useState(false);
  const trendValues = useMemo(() => {
    if (!trend.length) {
      return [0, 0, 0, 0, 0, 0, 0];
    }

    const maxScore = Math.max(...trend.map((item) => item.score), 1);
    return trend.map((item) => Math.round((item.score / maxScore) * 100));
  }, [trend]);

  async function handleRecalculate() {
    try {
      setIsRecalculating(true);
      setActionMessage("");
      await recalculateScore();
      await refreshScore();
      setActionMessage("Discipline score recalculated.");
    } catch (recalculateError) {
      setActionMessage(recalculateError.message);
    } finally {
      setIsRecalculating(false);
    }
  }

  return (
    <>
      {error && <p className="form-message form-error">{error}</p>}
      {actionMessage && (
        <p
          className={`form-message ${actionMessage.includes("recalculated") ? "form-success" : "form-error"}`}
        >
          {actionMessage}
        </p>
      )}
      <Card className="score-hero">
        <p className="eyebrow">Large Score Hero</p>
        <strong>{score?.totalXp || 0}</strong>
        <span>
          Rank: {score?.currentRank || "D"}
          {score?.nextRank ? ` - Next: ${score.nextRank}` : ""}
        </span>
        <span>{score?.xpNeeded || 0} XP needed</span>
        <ProgressBar value={score?.progressPercentage || 0} />
        <Button
          variant="secondary"
          onClick={handleRecalculate}
          disabled={isRecalculating || isLoading}
        >
          <RefreshCcw size={16} />
          {isRecalculating ? "Recalculating..." : "Recalculate Score"}
        </Button>
      </Card>
      <div className="content-grid split">
        <Card title="Rank Ladder" label="Progression">
          <div className="list-stack">
            {disciplineRankLadder.map((rank) => (
              <div className="compact-row" key={rank}>
                <span>{rank} Rank</span>
                <Badge
                  label={
                    rank === (score?.currentRank || "D") ? "Current" : "Locked"
                  }
                  tone={
                    rank === (score?.currentRank || "D") ? "default" : "muted"
                  }
                />
              </div>
            ))}
          </div>
        </Card>
        <Card title="Score Breakdown" label="Inputs">
          <div className="list-stack">
            {breakdown.map((item) => (
              <div key={item.source}>
                <div className="card-row">
                  <span>{item.label}</span>
                  <strong className={item.points < 0 ? "danger-text" : ""}>
                    {item.points > 0 ? "+" : ""}
                    {item.points} XP
                  </strong>
                </div>
                <ProgressBar value={item.percentage} />
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card title="Consumption Control" label="Score category">
        <div className="list-stack">
          {breakdown.map((category) => (
            <div className="compact-row" key={category.source}>
              <span>{category.label}</span>
              <strong className={category.points < 0 ? "danger-text" : ""}>
                {category.points > 0 ? "+" : ""}
                {category.points} XP
              </strong>
            </div>
          ))}
          {breakdown.length === 0 && (
            <p className="muted-text">No score events yet.</p>
          )}
        </div>
      </Card>
      <Card title="7-Day Score Trend" label="Momentum">
        <LineChartMock values={trendValues} />
      </Card>
      <Card title="Score Events" label="History">
        <div className="list-stack">
          {events.slice(0, 8).map((event) => (
            <div className="compact-row" key={event.id}>
              <span>{event.description}</span>
              <strong className={event.points < 0 ? "danger-text" : ""}>
                {event.points > 0 ? "+" : ""}
                {event.points} XP
              </strong>
            </div>
          ))}
          {events.length === 0 && (
            <p className="muted-text">No score events yet.</p>
          )}
        </div>
      </Card>
      <Card title="Achievement Badges" label="Identity shift message">
        <p className="identity-message">
          You are becoming the person who keeps promises under resistance.
        </p>
      </Card>
    </>
  );
}

export function AnalyticsPage() {
  const { summary: analyticsSummary } = useAchievements();
  const { summary: analyticsIdentitySummary } = useIdentity();
  const { data: overview } = useAnalytics(getOverview);
  const { data: focus } = useAnalytics(getFocus);
  const { data: missionAnalytics } = useAnalytics(getMissionAnalytics);
  const { data: consumptionAnalytics } = useAnalytics(getConsumptionAnalytics);
  const focusHours = focus?.trend?.map((item) => item.hours) || [];
  const weeklyVideos =
    consumptionAnalytics?.trend?.map((item) => item.videos) || [];
  const weeklyMinutes =
    consumptionAnalytics?.trend?.map((item) => item.minutes) || [];
  const consumptionTrend =
    consumptionAnalytics?.trend?.map((item) => item.score) || [];
  const platformBreakdown =
    consumptionAnalytics?.platformBreakdown?.map(
      (platform) => platform.videos,
    ) || [];

  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="Focus Intelligence"
        description="Measure hours, success rate, blocks prevented, and saved time."
      />
      <div className="stats-grid">
        <StatCard
          label="Mission Success Rate"
          value={`${overview?.missionSuccessRate || 0}%`}
          icon={CheckCircle2}
        />
        <StatCard
          label="Blocks Prevented"
          value={missionAnalytics?.completedMissions || 0}
          icon={Ban}
        />
        <StatCard
          label="Time Saved"
          value={consumptionAnalytics?.timeSaved || "0m"}
          icon={Clock}
        />
        <StatCard
          label="Weekly Average"
          value={`${consumptionAnalytics?.averageDailyConsumption || 0} videos`}
          icon={Activity}
        />
        <StatCard
          label="Best Day"
          value={focus?.bestFocusDay || "None"}
          icon={Trophy}
        />
        <StatCard
          label="Total Sessions"
          value={overview?.completedSessions || 0}
          icon={Target}
        />
        <StatCard
          label="Total Goals"
          value={overview?.totalGoals || 0}
          icon={Target}
        />
        <StatCard
          label="Completed Goals"
          value={overview?.completedGoals || 0}
          icon={CheckCircle2}
        />
        <StatCard
          label="Avg Goal Progress"
          value={`${overview?.averageGoalProgress || 0}%`}
          icon={Activity}
        />
        <StatCard
          label="Upcoming Deadlines"
          value={overview?.upcomingDeadlines?.length || 0}
          icon={Clock}
        />
        <StatCard
          label="Achievements Unlocked"
          value={analyticsSummary?.unlocked || 0}
          icon={Trophy}
        />
        <StatCard
          label="Achievement Completion"
          value={`${analyticsSummary?.completionPercentage || 0}%`}
          icon={CheckCircle2}
        />
        <StatCard
          label="XP from Achievements"
          value={`+${analyticsSummary?.xpFromAchievements || 0}`}
          icon={Gauge}
        />
        <StatCard
          label="Identity Title"
          value={
            analyticsIdentitySummary?.currentTitle || "Discipline Beginner"
          }
          icon={Trophy}
        />
        <StatCard
          label="Identity Score"
          value={`${analyticsIdentitySummary?.identityScore || 0}/100`}
          icon={Gauge}
        />
        <StatCard
          label="Time Consumed"
          value={`${consumptionAnalytics?.totalMinutes || 0}m`}
          icon={Smartphone}
        />
      </div>
      <Card title="Focus Hours Chart" label="Last 7 days">
        <MiniBarChart values={focusHours} />
      </Card>
      <section className="panel-section">
        <div className="card-head">
          <div>
            <p className="eyebrow">Create more, consume less</p>
            <h3>Consumption Analytics</h3>
          </div>
        </div>
        <div className="content-grid split">
          <Card title="Weekly Reels" label="Videos">
            <MiniBarChart values={weeklyVideos} />
          </Card>
          <Card title="Weekly Shorts" label="Minutes">
            <MiniBarChart values={weeklyMinutes} />
          </Card>
          <Card title="Time Saved" label="Avoided consumption">
            <LineChartMock values={consumptionTrend} />
          </Card>
          <Card title="Consumption Trend" label="Last 7 days">
            <LineChartMock values={consumptionTrend} />
          </Card>
          <Card title="Platform Breakdown" label="Share of consumption">
            <MiniBarChart values={platformBreakdown} />
          </Card>
        </div>
      </section>
    </>
  );
}

export function AchievementsPage() {
  const {
    achievements: userAchievements,
    summary,
    isLoading,
    error,
    refreshAchievements,
  } = useAchievements();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [rarityFilter, setRarityFilter] = useState("");
  const [recalcMsg, setRecalcMsg] = useState("");

  const achievementCategories = [
    "MISSION",
    "STREAK",
    "FOCUS",
    "DISCIPLINE",
    "GOALS",
    "DIGITAL_WELLNESS",
    "SPECIAL",
  ];
  const achievementRarities = [
    "COMMON",
    "UNCOMMON",
    "RARE",
    "EPIC",
    "LEGENDARY",
  ];

  const filtered = userAchievements.filter((achievement) => {
    const matchesQuery =
      !query ||
      achievement.title.toLowerCase().includes(query.toLowerCase()) ||
      (achievement.description || "")
        .toLowerCase()
        .includes(query.toLowerCase());
    const matchesCategory =
      !categoryFilter || achievement.category === categoryFilter;
    const matchesRarity = !rarityFilter || achievement.rarity === rarityFilter;
    return matchesQuery && matchesCategory && matchesRarity;
  });

  const group = (state) =>
    filtered.filter((achievement) => achievement.state === state);

  const handleRecalculate = async () => {
    setRecalcMsg("");
    try {
      const result = await recalculateAchievements();
      setRecalcMsg(
        `Recalculated — ${result.newlyUnlocked || 0} newly unlocked.`,
      );
      await refreshAchievements();
    } catch (err) {
      setRecalcMsg(err.message || "Recalculation failed");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Achievements"
        title="Badge Vault"
        description="Unlocked badges, locked badges, and progress badges."
        action={
          <Button variant="secondary" onClick={handleRecalculate}>
            <RefreshCcw size={15} />
            Recalculate
          </Button>
        }
      />

      <div className="review-grid compact-review">
        <ReviewStatCard label="Unlocked" value={summary?.unlocked || 0} />
        <ReviewStatCard label="Total" value={summary?.totalAchievements || 0} />
        <ReviewStatCard
          label="Completion"
          value={`${summary?.completionPercentage || 0}%`}
        />
        <ReviewStatCard
          label="XP from Achievements"
          value={`+${summary?.xpFromAchievements || 0}`}
        />
      </div>

      <Card title="Filter Achievements" label="Search and filter">
        <div className="form-grid">
          <Input
            label="Search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search achievements..."
          />
          <Select
            label="Category"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="">All Categories</option>
            {achievementCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace("_", " ")}
              </option>
            ))}
          </Select>
          <Select
            label="Rarity"
            value={rarityFilter}
            onChange={(event) => setRarityFilter(event.target.value)}
          >
            <option value="">All Rarities</option>
            {achievementRarities.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </div>
        {recalcMsg && <p className="success-text">{recalcMsg}</p>}
        {error && <p className="error-text">{error}</p>}
      </Card>

      {isLoading && <p className="muted-text">Loading achievements...</p>}

      {["Unlocked", "Progress", "Locked"].map((state) => (
        <Card
          key={state}
          title={`${state} Badges`}
          label={`${group(state).length} achievements`}
        >
          <div className="achievement-grid">
            {group(state).map((achievement) => (
              <AchievementBadge
                key={achievement.id}
                achievement={achievement}
              />
            ))}
            {group(state).length === 0 && (
              <p className="muted-text">
                No {state.toLowerCase()} achievements match your filter.
              </p>
            )}
          </div>
        </Card>
      ))}
    </>
  );
}

export function GoalsHubPage() {
  const {
    goals: userGoals,
    summary,
    error: loadError,
    isLoading,
    refreshGoals,
  } = useGoals();
  const { missions: userMissions } = useMissions();
  const [form, setForm] = useState(defaultGoalForm);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [progressGoalId, setProgressGoalId] = useState(null);
  const [progressValue, setProgressValue] = useState(0);
  const [selectedMissionByGoal, setSelectedMissionByGoal] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const activeMissions = userMissions.filter((mission) => !mission.archived);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const goalPayloadFromForm = () => ({
    title: form.title,
    description: form.description,
    category: form.category,
    priority: form.priority,
    targetValue: form.targetValue === "" ? undefined : Number(form.targetValue),
    currentValue: form.currentValue === "" ? 0 : Number(form.currentValue),
    unit: form.unit,
    targetDate: form.targetDate || undefined,
  });

  const resetGoalForm = () => {
    setForm(defaultGoalForm);
    setEditingGoalId(null);
  };

  const handleSaveGoal = async () => {
    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = goalPayloadFromForm();
      if (editingGoalId) {
        await updateGoal(editingGoalId, payload);
        setMessage("Goal updated.");
      } else {
        await createGoal(payload);
        setMessage("Goal created.");
      }
      resetGoalForm();
      await refreshGoals();
    } catch (saveError) {
      setError(saveError.message || "Unable to save goal");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditGoal = (goal) => {
    setEditingGoalId(goal.id);
    setForm({
      title: goal.title || "",
      description: goal.description || "",
      category: goal.category || "STUDY",
      priority: goal.priority || "MEDIUM",
      targetValue: goal.targetValue ?? "",
      currentValue: goal.currentValue ?? 0,
      unit: goal.unit || "sessions",
      targetDate: goal.targetDate ? goal.targetDate.slice(0, 10) : "",
    });
  };

  const handleGoalAction = async (action, successText) => {
    setError("");
    setMessage("");
    try {
      await action();
      setMessage(successText);
      await refreshGoals();
    } catch (actionError) {
      setError(actionError.message || "Goal action failed");
    }
  };

  const handleProgressSave = (goal) => {
    handleGoalAction(
      () =>
        updateGoalProgress(goal.id, { currentValue: Number(progressValue) }),
      "Goal progress updated.",
    );
    setProgressGoalId(null);
  };

  const formatGoalDate = (goal) => {
    if (!goal.targetDate) return "No target date";
    return formatDate(goal.targetDate);
  };

  return (
    <>
      <PageHeader
        eyebrow="Goals Hub"
        title="Long-Term Goals"
        description="Connect strategic goals to repeatable focus missions."
        action={
          <Button onClick={resetGoalForm}>
            <Plus size={15} />
            Add New Goal
          </Button>
        }
      />

      <div className="review-grid compact-review">
        <ReviewStatCard
          label="Active Goals"
          value={summary?.activeGoals || 0}
        />
        <ReviewStatCard
          label="Completed Goals"
          value={summary?.completedGoals || 0}
        />
        <ReviewStatCard
          label="Average Progress"
          value={`${summary?.averageProgress || 0}%`}
        />
        <ReviewStatCard
          label="High Priority"
          value={summary?.highPriorityGoals || 0}
        />
      </div>

      <Card
        title={editingGoalId ? "Edit Goal" : "Create Goal"}
        label="Long-term outcome"
      >
        <div className="form-grid">
          <Input
            label="Title"
            value={form.title}
            onChange={(event) => updateField("title", event.target.value)}
          />
          <Input
            label="Description"
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
          />
          <Select
            label="Category"
            value={form.category}
            onChange={(event) => updateField("category", event.target.value)}
          >
            {goalCategories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </Select>
          <Select
            label="Priority"
            value={form.priority}
            onChange={(event) => updateField("priority", event.target.value)}
          >
            {goalPriorities.map((priority) => (
              <option key={priority}>{priority}</option>
            ))}
          </Select>
          <Input
            label="Target Value"
            type="number"
            min="1"
            value={form.targetValue}
            onChange={(event) => updateField("targetValue", event.target.value)}
          />
          <Input
            label="Current Value"
            type="number"
            min="0"
            value={form.currentValue}
            onChange={(event) =>
              updateField("currentValue", event.target.value)
            }
          />
          <Input
            label="Unit"
            value={form.unit}
            onChange={(event) => updateField("unit", event.target.value)}
            placeholder="topics, books, sessions"
          />
          <Input
            label="Target Date"
            type="date"
            value={form.targetDate}
            onChange={(event) => updateField("targetDate", event.target.value)}
          />
        </div>
        <div className="button-row">
          <Button onClick={handleSaveGoal} disabled={isSaving}>
            {isSaving
              ? "Saving..."
              : editingGoalId
                ? "Update Goal"
                : "Create Goal"}
          </Button>
          {editingGoalId && (
            <Button variant="secondary" onClick={resetGoalForm}>
              Cancel Edit
            </Button>
          )}
        </div>
        {(error || loadError) && (
          <p className="error-text">{error || loadError}</p>
        )}
        {message && <p className="success-text">{message}</p>}
      </Card>

      {isLoading && <p className="muted-text">Loading goals...</p>}
      {!isLoading && userGoals.length === 0 && (
        <Card title="No goals yet" label="Start with one strategic outcome">
          <p className="muted-text">
            Create your first long-term goal and connect it to focus missions.
          </p>
        </Card>
      )}

      <div className="card-grid">
        {userGoals.map((goal) => (
          <Card
            key={goal.id}
            title={goal.title}
            label={`${goal.missions || 0} connected missions`}
          >
            <ProgressBar value={goal.progressPercentage || 0} />
            <div className="card-row">
              <span>Progress</span>
              <strong>{goal.progressPercentage || 0}%</strong>
            </div>
            <div className="card-row">
              <span>Category</span>
              <strong>{goal.category}</strong>
            </div>
            <div className="card-row">
              <span>Priority</span>
              <strong>{goal.priority}</strong>
            </div>
            <div className="card-row">
              <span>Status</span>
              <strong>{goal.status}</strong>
            </div>
            <div className="card-row">
              <span>Target</span>
              <strong>
                {goal.targetValue
                  ? `${goal.currentValue}/${goal.targetValue} ${goal.unit || ""}`
                  : goal.unit || "Manual"}
              </strong>
            </div>
            <div className="card-row">
              <span>Target Date</span>
              <strong>{formatGoalDate(goal)}</strong>
            </div>
            {goal.description && (
              <p className="muted-text">{goal.description}</p>
            )}

            <div className="list-stack">
              <p className="eyebrow">Connected Missions</p>
              {(goal.connectedMissions || []).map((mission) => (
                <div className="card-row" key={mission.id}>
                  <span>{mission.title}</span>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      handleGoalAction(
                        () => removeMission(goal.id, mission.id),
                        "Mission removed from goal.",
                      )
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))}
              {(goal.connectedMissions || []).length === 0 && (
                <p className="muted-text">
                  {activeMissions.length
                    ? "No missions connected yet."
                    : "Create missions first to connect them with this goal."}
                </p>
              )}
              {activeMissions.length > 0 && (
                <div className="button-row">
                  <Select
                    label="Connect Mission"
                    value={selectedMissionByGoal[goal.id] || ""}
                    onChange={(event) =>
                      setSelectedMissionByGoal((current) => ({
                        ...current,
                        [goal.id]: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select mission</option>
                    {activeMissions.map((mission) => (
                      <option key={mission.id} value={mission.id}>
                        {mission.title}
                      </option>
                    ))}
                  </Select>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      selectedMissionByGoal[goal.id] &&
                      handleGoalAction(
                        () =>
                          connectMission(
                            goal.id,
                            selectedMissionByGoal[goal.id],
                          ),
                        "Mission connected to goal.",
                      )
                    }
                  >
                    Connect
                  </Button>
                </div>
              )}
            </div>

            {progressGoalId === goal.id && (
              <div className="button-row">
                <Input
                  label={`Current ${goal.unit || "value"}`}
                  type="number"
                  min="0"
                  value={progressValue}
                  onChange={(event) => setProgressValue(event.target.value)}
                />
                <Button onClick={() => handleProgressSave(goal)}>
                  Save Progress
                </Button>
              </div>
            )}

            <div className="button-row">
              <Button variant="secondary" onClick={() => handleEditGoal(goal)}>
                <Edit3 size={14} />
                Edit
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setProgressGoalId(goal.id);
                  setProgressValue(goal.currentValue || 0);
                }}
              >
                Update Progress
              </Button>
              {goal.status !== "COMPLETED" && (
                <Button
                  variant="secondary"
                  onClick={() =>
                    handleGoalAction(
                      () => completeGoalById(goal.id),
                      "Goal completed.",
                    )
                  }
                >
                  <CheckCircle2 size={14} />
                  Complete
                </Button>
              )}
              {goal.status === "PAUSED" ? (
                <Button
                  variant="secondary"
                  onClick={() =>
                    handleGoalAction(() => resumeGoal(goal.id), "Goal resumed.")
                  }
                >
                  <Play size={14} />
                  Resume
                </Button>
              ) : goal.status === "ACTIVE" ? (
                <Button
                  variant="secondary"
                  onClick={() =>
                    handleGoalAction(() => pauseGoal(goal.id), "Goal paused.")
                  }
                >
                  <Pause size={14} />
                  Pause
                </Button>
              ) : null}
              {!goal.archived && (
                <Button
                  variant="secondary"
                  onClick={() =>
                    handleGoalAction(
                      () => archiveGoal(goal.id),
                      "Goal archived.",
                    )
                  }
                >
                  <Archive size={14} />
                  Archive
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

export function WeeklyReviewPage() {
  const { error, history, isLoading, refreshReview, review } =
    useWeeklyReview();
  const [message, setMessage] = useState("");

  async function handleGenerate() {
    try {
      setMessage("");
      await refreshReview();
      setMessage("Weekly review regenerated.");
    } catch (generateError) {
      setMessage(generateError.message || "Unable to regenerate weekly review");
    }
  }

  const stats = review?.statistics || {};
  const highlights = review?.highlights || {};

  return (
    <>
      <PageHeader
        eyebrow={review?.week?.range || "Weekly Review"}
        title="Weekly Discipline Review"
        description="A backend-generated reflection on focus, discipline, goals, consumption, achievements, and identity."
        action={
          <Button
            variant="secondary"
            onClick={handleGenerate}
            disabled={isLoading}
          >
            <RefreshCcw size={15} />
            Generate
          </Button>
        }
      />
      {error && <p className="form-message form-error">{error}</p>}
      {message && (
        <p
          className={`form-message ${message.includes("regenerated") ? "form-success" : "form-error"}`}
        >
          {message}
        </p>
      )}

      <div className="review-grid">
        <ReviewStatCard label="Weekly Grade" value={review?.grade || "F"} />
        <ReviewStatCard
          label="Weekly Score"
          value={`${review?.overallScore || 0}/100`}
        />
        <ReviewStatCard
          label="Identity"
          value={review?.identity?.title || "Discipline Beginner"}
        />
        <ReviewStatCard
          label="Rank"
          value={review?.identity?.currentRank || "D"}
        />
        <ReviewStatCard
          label="Focus Hours"
          value={`${stats.focusHours || 0}h`}
        />
        <ReviewStatCard
          label="Success Rate"
          value={`${stats.missionSuccessRate || 0}%`}
        />
        <ReviewStatCard label="XP Earned" value={`+${stats.xpEarned || 0}`} />
        <ReviewStatCard
          label="Consumption Score"
          value={`${stats.consumptionScore || 0}%`}
        />
      </div>

      <Card title="Weekly Summary" label="Operator note">
        <p>
          {review?.summaryMessage ||
            "Weekly review will appear after your first tracked activity."}
        </p>
      </Card>

      <div className="content-grid split">
        <Card title="Focus Summary" label="Deep work">
          <div className="list-stack">
            <div className="card-row">
              <span>Focus Minutes</span>
              <strong>{stats.focusMinutes || 0}m</strong>
            </div>
            <div className="card-row">
              <span>Average Session</span>
              <strong>{stats.averageSessionDuration || 0}m</strong>
            </div>
            <div className="card-row">
              <span>Longest Session</span>
              <strong>{stats.longestSession || 0}m</strong>
            </div>
            <div className="card-row">
              <span>Shortest Session</span>
              <strong>{stats.shortestSession || 0}m</strong>
            </div>
            <div className="card-row">
              <span>Best Focus Day</span>
              <strong>{stats.bestFocusDay || "None"}</strong>
            </div>
            <div className="card-row">
              <span>Worst Focus Day</span>
              <strong>{stats.worstFocusDay || "None"}</strong>
            </div>
          </div>
        </Card>
        <Card title="Mission Summary" label="Execution">
          <div className="list-stack">
            <div className="card-row">
              <span>Completed</span>
              <strong>{stats.completedSessions || 0}</strong>
            </div>
            <div className="card-row">
              <span>Abandoned</span>
              <strong>{stats.abandonedSessions || 0}</strong>
            </div>
            <div className="card-row">
              <span>Current Streak</span>
              <strong>{stats.currentStreak || 0} days</strong>
            </div>
            <div className="card-row">
              <span>Best Streak</span>
              <strong>{stats.bestStreak || 0} days</strong>
            </div>
            <div className="card-row">
              <span>Rank Progress</span>
              <strong>{stats.rankProgress || 0}%</strong>
            </div>
          </div>
        </Card>
        <Card title="Consumption Summary" label="Digital wellness">
          <div className="list-stack">
            <div className="card-row">
              <span>Videos Watched</span>
              <strong>{stats.videosWatched || 0}</strong>
            </div>
            <div className="card-row">
              <span>Time Saved</span>
              <strong>{stats.timeSaved || "0m"}</strong>
            </div>
            <div className="card-row">
              <span>Healthy Days</span>
              <strong>{stats.healthyConsumptionDays || 0}</strong>
            </div>
          </div>
        </Card>
        <Card title="Goal Summary" label="Long-term progress">
          <div className="list-stack">
            <div className="card-row">
              <span>Goals Completed</span>
              <strong>{review?.goals?.completedThisWeek || 0}</strong>
            </div>
            <div className="card-row">
              <span>Active Goals</span>
              <strong>{review?.goals?.activeGoals || 0}</strong>
            </div>
            <div className="card-row">
              <span>Average Progress</span>
              <strong>{review?.goals?.averageProgress || 0}%</strong>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Weekly Highlights" label="What stood out">
        <div className="review-grid compact-review">
          <ReviewStatCard
            label="Biggest Achievement"
            value={highlights.biggestAchievement || "None"}
          />
          <ReviewStatCard
            label="Best Focus Day"
            value={highlights.bestFocusDay || "None"}
          />
          <ReviewStatCard
            label="Longest Deep Work"
            value={highlights.longestDeepWorkSession || "0m"}
          />
          <ReviewStatCard
            label="Most Productive"
            value={highlights.mostProductiveDay || "None"}
          />
          <ReviewStatCard
            label="Strongest Trait"
            value={highlights.strongestTrait || "None"}
          />
          <ReviewStatCard
            label="Identity Progress"
            value={highlights.identityProgress || "Stable"}
          />
        </div>
      </Card>

      <div className="content-grid split">
        <Card title="Insights" label="Rule-based findings">
          <div className="list-stack">
            {(review?.insights || []).map((insight) => (
              <p key={insight} className="muted-text">
                {insight}
              </p>
            ))}
          </div>
        </Card>
        <Card title="Recommendations" label="Next week">
          <div className="list-stack">
            {(review?.recommendations || []).map((recommendation) => (
              <p key={recommendation} className="muted-text">
                {recommendation}
              </p>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Achievement Summary" label="Unlocked this week">
        <div className="list-stack">
          {(review?.achievements?.unlocked || []).map((achievement) => (
            <div className="card-row" key={achievement.code}>
              <span>{achievement.title}</span>
              <strong>+{achievement.xpReward} XP</strong>
            </div>
          ))}
          {(review?.achievements?.unlocked || []).length === 0 && (
            <p className="muted-text">No achievements unlocked this week.</p>
          )}
        </div>
      </Card>

      <Card title="Previous Weekly Reviews" label="History">
        <div className="list-stack">
          {history.slice(0, 4).map((item) => (
            <div className="card-row" key={item.startDate}>
              <span>{item.range}</span>
              <strong>
                {item.grade} · {item.overallScore}/100
              </strong>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

export function MonthlyReviewPage() {
  const { error, history, isLoading, refreshReview, review } =
    useMonthlyReview();
  const [message, setMessage] = useState("");

  async function handleGenerate() {
    try {
      setMessage("");
      await refreshReview();
      setMessage("Monthly review regenerated.");
    } catch (generateError) {
      setMessage(
        generateError.message || "Unable to regenerate monthly review",
      );
    }
  }

  const stats = review?.statistics || {};
  const comparison = review?.comparison || {};
  const highlights = review?.highlights || {};

  return (
    <>
      <PageHeader
        eyebrow={review?.monthLabel || "Monthly Review"}
        title="Monthly Discipline Report"
        description="A backend-generated monthly reflection on focus, execution, consumption, goals, achievements, and identity."
        action={
          <Button
            variant="secondary"
            onClick={handleGenerate}
            disabled={isLoading}
          >
            <RefreshCcw size={15} />
            Generate
          </Button>
        }
      />
      {error && <p className="form-message form-error">{error}</p>}
      {message && (
        <p
          className={`form-message ${message.includes("regenerated") ? "form-success" : "form-error"}`}
        >
          {message}
        </p>
      )}

      <div className="review-grid">
        <ReviewStatCard label="Monthly Grade" value={review?.grade || "F"} />
        <ReviewStatCard
          label="Monthly Score"
          value={`${review?.overallScore || 0}/100`}
        />
        <ReviewStatCard
          label="Identity"
          value={review?.identity?.title || "Discipline Beginner"}
        />
        <ReviewStatCard
          label="Rank"
          value={review?.identity?.currentRank || "D"}
        />
        <ReviewStatCard
          label="Focus Hours"
          value={`${stats.totalFocusHours || 0}h`}
        />
        <ReviewStatCard
          label="Success Rate"
          value={`${stats.missionSuccessRate || 0}%`}
        />
        <ReviewStatCard label="XP Earned" value={`+${stats.xpEarned || 0}`} />
        <ReviewStatCard
          label="Consumption Score"
          value={`${stats.consumptionScore || 0}%`}
        />
      </div>

      <Card title="Monthly Summary" label="Operator note">
        <p>
          {review?.summaryMessage ||
            "Monthly review will appear after your first tracked activity."}
        </p>
      </Card>

      <div className="content-grid split">
        <Card title="Focus Summary" label="Deep work">
          <div className="list-stack">
            <div className="card-row">
              <span>Total Focus Minutes</span>
              <strong>{stats.totalFocusMinutes || 0}m</strong>
            </div>
            <div className="card-row">
              <span>Average Session</span>
              <strong>{stats.averageSessionDuration || 0}m</strong>
            </div>
            <div className="card-row">
              <span>Longest Session</span>
              <strong>{stats.longestSession || 0}m</strong>
            </div>
            <div className="card-row">
              <span>Shortest Session</span>
              <strong>{stats.shortestSession || 0}m</strong>
            </div>
            <div className="card-row">
              <span>Best Focus Day</span>
              <strong>{stats.bestFocusDay || "None"}</strong>
            </div>
            <div className="card-row">
              <span>Focus Days</span>
              <strong>{stats.focusDays || 0}</strong>
            </div>
            <div className="card-row">
              <span>Inactive Days</span>
              <strong>{stats.inactiveDays || 0}</strong>
            </div>
          </div>
        </Card>
        <Card title="Mission Summary" label="Execution">
          <div className="list-stack">
            <div className="card-row">
              <span>Completed</span>
              <strong>{stats.completedSessions || 0}</strong>
            </div>
            <div className="card-row">
              <span>Abandoned</span>
              <strong>{stats.abandonedSessions || 0}</strong>
            </div>
            <div className="card-row">
              <span>Most Productive Day</span>
              <strong>{stats.mostProductiveDay || "None"}</strong>
            </div>
            <div className="card-row">
              <span>Least Productive Day</span>
              <strong>{stats.leastProductiveDay || "None"}</strong>
            </div>
            <div className="card-row">
              <span>Current Streak</span>
              <strong>{stats.currentStreak || 0} days</strong>
            </div>
            <div className="card-row">
              <span>Best Streak</span>
              <strong>{stats.bestStreak || 0} days</strong>
            </div>
          </div>
        </Card>
        <Card title="Consumption Summary" label="Digital wellness">
          <div className="list-stack">
            <div className="card-row">
              <span>Videos Watched</span>
              <strong>{stats.videosWatched || 0}</strong>
            </div>
            <div className="card-row">
              <span>Time Saved</span>
              <strong>{stats.timeSaved || "0m"}</strong>
            </div>
            <div className="card-row">
              <span>Healthy Days</span>
              <strong>{stats.healthyConsumptionDays || 0}</strong>
            </div>
            <div className="card-row">
              <span>Limit Reached Days</span>
              <strong>{stats.limitReachedDays || 0}</strong>
            </div>
          </div>
        </Card>
        <Card title="Goal Summary" label="Long-term outcomes">
          <div className="list-stack">
            <div className="card-row">
              <span>Completed Goals</span>
              <strong>{review?.goals?.completedCount || 0}</strong>
            </div>
            <div className="card-row">
              <span>Active Goals</span>
              <strong>{review?.goals?.activeGoals || 0}</strong>
            </div>
            <div className="card-row">
              <span>Average Progress</span>
              <strong>{review?.goals?.averageProgress || 0}%</strong>
            </div>
            <div className="card-row">
              <span>Overdue Goals</span>
              <strong>{review?.goals?.overdueGoals || 0}</strong>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Monthly Highlights" label="What stood out">
        <div className="review-grid compact-review">
          <ReviewStatCard
            label="Biggest Achievement"
            value={highlights.biggestAchievement || "None"}
          />
          <ReviewStatCard
            label="Longest Deep Work"
            value={highlights.longestDeepWorkSession || "0m"}
          />
          <ReviewStatCard
            label="Most Productive Week"
            value={highlights.mostProductiveWeek || "None"}
          />
          <ReviewStatCard
            label="Strongest Trait"
            value={highlights.strongestTrait || "None"}
          />
          <ReviewStatCard
            label="Identity Progress"
            value={highlights.identityProgress || "Stable"}
          />
          <ReviewStatCard
            label="Best Focus Day"
            value={highlights.bestFocusDay || "None"}
          />
          <ReviewStatCard
            label="Largest Goal"
            value={highlights.largestGoalCompleted || "None"}
          />
        </div>
      </Card>

      <Card
        title="Month-to-Month Comparison"
        label="Compared with previous month"
      >
        <div className="review-grid compact-review">
          <ReviewStatCard
            label="Focus Hours"
            value={`${comparison.focusHoursDifference?.absolute || 0}h (${comparison.focusHoursDifference?.percentage || 0}%)`}
          />
          <ReviewStatCard
            label="Sessions"
            value={`${comparison.sessionDifference?.absolute || 0} (${comparison.sessionDifference?.percentage || 0}%)`}
          />
          <ReviewStatCard
            label="XP"
            value={`${comparison.xpDifference?.absolute || 0} (${comparison.xpDifference?.percentage || 0}%)`}
          />
          <ReviewStatCard
            label="Consumption"
            value={`${comparison.consumptionDifference?.absolute || 0} videos`}
          />
          <ReviewStatCard
            label="Goals"
            value={`${comparison.goalDifference?.absolute || 0}`}
          />
          <ReviewStatCard
            label="Identity"
            value={
              comparison.identityChange?.changed
                ? `${comparison.identityChange.from} → ${comparison.identityChange.to}`
                : "Stable"
            }
          />
          <ReviewStatCard
            label="Rank"
            value={
              comparison.rankChange?.changed
                ? `${comparison.rankChange.from} → ${comparison.rankChange.to}`
                : "Stable"
            }
          />
        </div>
      </Card>

      <div className="content-grid split">
        <Card title="Insights" label="Rule-based findings">
          <div className="list-stack">
            {(review?.insights || []).map((insight) => (
              <p key={insight} className="muted-text">
                {insight}
              </p>
            ))}
          </div>
        </Card>
        <Card title="Recommendations" label="Next month">
          <div className="list-stack">
            {(review?.recommendations || []).map((recommendation) => (
              <p key={recommendation} className="muted-text">
                {recommendation}
              </p>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Achievement Summary" label="Unlocked this month">
        <div className="list-stack">
          {(review?.achievements?.unlocked || []).map((achievement) => (
            <div className="card-row" key={achievement.code}>
              <span>{achievement.title}</span>
              <strong>+{achievement.xpReward} XP</strong>
            </div>
          ))}
          {(review?.achievements?.unlocked || []).length === 0 && (
            <p className="muted-text">No achievements unlocked this month.</p>
          )}
        </div>
      </Card>

      <Card title="Previous Monthly Reviews" label="History">
        <div className="list-stack">
          {history.slice(0, 4).map((item) => (
            <div className="card-row" key={`${item.year}-${item.month}`}>
              <span>{item.monthLabel}</span>
              <strong>
                {item.grade} · {item.overallScore}/100
              </strong>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

export function IdentityPage() {
  const { user } = useAuth();
  const { error, identity, isLoading, progression, refreshIdentity, traits } =
    useIdentity();
  const [actionMessage, setActionMessage] = useState("");
  const [isRecalculating, setIsRecalculating] = useState(false);

  async function handleRecalculateIdentity() {
    try {
      setIsRecalculating(true);
      setActionMessage("");
      await recalculateIdentity();
      await refreshIdentity();
      setActionMessage("Identity recalculated.");
    } catch (recalculateError) {
      setActionMessage(
        recalculateError.message || "Unable to recalculate identity",
      );
    } finally {
      setIsRecalculating(false);
    }
  }

  return (
    <>
      {error && <p className="form-message form-error">{error}</p>}
      {actionMessage && (
        <p
          className={`form-message ${actionMessage.includes("recalculated") ? "form-success" : "form-error"}`}
        >
          {actionMessage}
        </p>
      )}
      <Card
        className="identity-card"
        action={
          <Button
            variant="secondary"
            onClick={handleRecalculateIdentity}
            disabled={isRecalculating || isLoading}
          >
            <RefreshCcw size={15} />
            {isRecalculating ? "Recalculating..." : "Recalculate"}
          </Button>
        }
      >
        <UserAvatar user={user} size="lg" />
        <p className="eyebrow">Identity Title</p>
        <strong>{identity?.currentTitle || "Discipline Beginner"}</strong>
        <p>
          {identity?.identityStatement ||
            "Every disciplined person starts with one completed mission."}
        </p>
        <ProgressBar value={identity?.identityScore || 0} />
        <div className="card-row">
          <span>Identity Score</span>
          <strong>{identity?.identityScore || 0}/100</strong>
        </div>
        <div className="card-row">
          <span>Tier</span>
          <strong>{identity?.currentTier || "STARTER"}</strong>
        </div>
      </Card>

      <div className="stats-grid">
        <StatCard
          label="Strongest Trait"
          value={identity?.strongestTrait?.name || "None yet"}
          meta={identity?.strongestTrait?.status}
          icon={Trophy}
        />
        <StatCard
          label="Weakest Trait"
          value={identity?.weakestTrait?.name || "None yet"}
          meta={identity?.weakestTrait?.status}
          icon={Activity}
        />
        <StatCard
          label="Member Since"
          value={formatMemberSince(
            identity?.memberSince || user?.createdAt,
          ).replace("Member since ", "")}
          icon={Clock}
        />
        <StatCard
          label="Current Streak"
          value={`${identity?.currentStreak || 0} days`}
          icon={Flame}
        />
        <StatCard
          label="Best Streak"
          value={`${identity?.bestStreak || 0} days`}
          icon={Flame}
        />
        <StatCard
          label="Focus Hours"
          value={`${identity?.totalFocusHours || 0}h`}
          icon={Clock}
        />
        <StatCard
          label="Completed Missions"
          value={identity?.completedMissions || 0}
          icon={CheckCircle2}
        />
        <StatCard
          label="Goals Completed"
          value={identity?.goalsCompleted || 0}
          icon={Target}
        />
        <StatCard
          label="Achievements"
          value={identity?.achievementsUnlocked || 0}
          meta={`${identity?.achievementCompletionPercentage || 0}% complete`}
          icon={Trophy}
        />
        <StatCard
          label="Digital Discipline Rating"
          value={identity?.digitalDisciplineRating || "D"}
          meta={`${identity?.consumptionScore || 0}% control`}
          icon={Gauge}
        />
        <StatCard
          label="Discipline Rank"
          value={identity?.disciplineRank || "D"}
          icon={Gauge}
        />
      </div>

      <Card title="Identity Traits" label="Backend-calculated behavior profile">
        <div className="list-stack">
          {traits.map((trait) => (
            <div key={trait.name}>
              <div className="card-row">
                <span>{trait.name}</span>
                <strong>
                  {trait.status} · {trait.score}%
                </strong>
              </div>
              <ProgressBar value={trait.score} />
              <p className="muted-text">{trait.explanation}</p>
            </div>
          ))}
          {traits.length === 0 && (
            <p className="muted-text">
              Identity traits will appear after calculation.
            </p>
          )}
        </div>
      </Card>

      <Card title="Identity Timeline" label="Progression snapshots">
        <div className="list-stack">
          {progression.map((snapshot) => (
            <div
              className="card-row"
              key={snapshot.id || `${snapshot.snapshotDate}-${snapshot.title}`}
            >
              <span>{formatDate(snapshot.snapshotDate)}</span>
              <strong>
                {snapshot.title} · {snapshot.score}/100
              </strong>
            </div>
          ))}
          {progression.length === 0 && (
            <p className="muted-text">No identity snapshots yet.</p>
          )}
        </div>
      </Card>
    </>
  );
}

export function BrowserExtensionPage() {
  const { effectiveRules, presets } = useBlockManager();
  const activePresetCount = presets.filter((preset) => preset.enabled).length;

  return (
    <>
      <PageHeader
        eyebrow="Browser Extension"
        title="Extension Control"
        description="Monitor connection state and synced blocking results."
        action={<Button>Manage Extension</Button>}
      />
      <div className="stats-grid">
        <StatCard label="Extension Status" value="Ready" icon={ShieldCheck} />
        <StatCard label="Sync Status" value="Sync-ready" icon={Activity} />
        <StatCard
          label="Effective Blocked"
          value={effectiveRules?.blockedDomains?.length || 0}
          icon={Ban}
        />
        <StatCard
          label="Allowed Websites"
          value={effectiveRules?.allowedDomains?.length || 0}
          icon={Lock}
        />
        <StatCard
          label="Active Presets"
          value={activePresetCount}
          icon={Target}
        />
        <StatCard label="Sync Engine" value="Pending" icon={Clock} />
      </div>
    </>
  );
}

export function SettingsPage() {
  const { user } = useAuth();

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Operating Defaults"
        description="General, notifications, focus rules, and account controls."
      />
      <Card title="Profile" label="Authenticated user">
        <div className="settings-profile">
          <UserAvatar user={user} size="md" />
          <div>
            <h3>{user?.fullName || "Operator"}</h3>
            <p>{user?.email}</p>
            <p>{user?.disciplineTitle || "DISCIPLINED BUILDER"}</p>
          </div>
        </div>
        <div className="review-grid compact-review">
          <ReviewStatCard
            label="Daily Goal"
            value={`${user?.dailyFocusGoal || 4}h`}
          />
          <ReviewStatCard
            label="Mission Duration"
            value={`${user?.preferredMissionDuration || 50}m`}
          />
          <ReviewStatCard
            label="Timezone"
            value={user?.timezone || "Asia/Kathmandu"}
          />
          <ReviewStatCard
            label="Member Since"
            value={formatMemberSince(user?.createdAt).replace(
              "Member since ",
              "",
            )}
          />
        </div>
      </Card>
      <div className="content-grid split">
        <SettingsSection
          title="General"
          rows={["Dark mode", "Start of week"]}
        />
        <SettingsSection
          title="Notifications"
          rows={["Daily goal", "Focus reminder interval"]}
        />
        <SettingsSection
          title="Focus Rules"
          rows={["Pause mission on idle", "Strict mode default"]}
        />
        <SettingsSection title="Account" rows={["Export data"]} />
      </div>
    </>
  );
}

function SettingsSection({ title, rows }) {
  return (
    <Card title={title} label="Settings">
      <div className="list-stack">
        {rows.map((row) => (
          <label className="compact-row" key={row}>
            <span>{row}</span>
            <input
              type="checkbox"
              defaultChecked={row !== "Pause mission on idle"}
            />
          </label>
        ))}
      </div>
    </Card>
  );
}

export function HelpPage() {
  return (
    <>
      <PageHeader
        eyebrow="Help & Support"
        title="Support Desk"
        description="FAQ, guides, contact, feedback, and quick links."
      />
      <div className="content-grid split">
        {["FAQ", "Guides", "Contact us", "Feedback", "Quick links"].map(
          (title) => (
            <Card key={title} title={title} label="Support">
              <p className="muted-text">
                Reference material for keeping the discipline system
                operational.
              </p>
            </Card>
          ),
        )}
      </div>
    </>
  );
}
