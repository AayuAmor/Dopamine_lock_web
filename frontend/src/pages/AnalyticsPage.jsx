import {
  Activity,
  Ban,
  CheckCircle2,
  Clock,
  Gauge,
  Smartphone,
  Target,
  Trophy,
} from "lucide-react";
import { Card, LineChartMock, MiniBarChart, PageHeader, StatCard } from "../components";
import { useAchievements } from "../hooks/useAchievements";
import { useAnalytics } from "../hooks/useAnalytics";
import { useIdentity } from "../hooks/useIdentity";
import {
  getConsumptionAnalytics,
  getFocus,
  getMissionAnalytics,
  getOverview,
} from "../services/analyticsService";

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
