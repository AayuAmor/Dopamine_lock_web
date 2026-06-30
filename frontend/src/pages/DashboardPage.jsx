import { useNavigate } from "react-router-dom";
import { Activity, Clock, Flame, Gauge, Target, TimerReset, Trophy } from "lucide-react";
import {
  ActionLink,
  Button,
  Card,
  MiniBarChart,
  PageHeader,
  ProgressBar,
  ReviewStatCard,
  SessionCard,
  StatCard,
} from "../components";
import { useDashboard } from "../hooks/useDashboard";
import { formatClock, formatDate, sessionCardFromHistory } from "./utils/formatters";

export function DashboardPage() {
  const navigate = useNavigate();
  const { dashboard, error, isLoading } = useDashboard();
  const userSummary = dashboard?.userSummary || {};
  const currentMission = dashboard?.currentMission;
  const missionStats = dashboard?.missionStats || {};
  const discipline = dashboard?.disciplineSummary || {};
  const streak = dashboard?.streakSummary || {};
  const consumption = dashboard?.consumptionSummary || {};
  const goals = dashboard?.goalsSummary || {};
  const achievements = dashboard?.achievementsSummary || {};
  const weekly = dashboard?.weeklyReviewSummary || {};
  const monthly = dashboard?.monthlyReviewSummary || {};
  const analytics = dashboard?.analyticsSnapshot || {};
  const quickActions = dashboard?.quickActions || {};
  const recentSessions = dashboard?.recentSessions || [];
  const hasActiveMission = Boolean(currentMission?.activeSession);

  return (
    <>
      <PageHeader
        eyebrow="Daily Command"
        title="Discipline Dashboard"
        description={`Welcome back, ${userSummary.fullName || "Operator"}. Track the mission, protect attention, and keep the streak intact.`}
      />
      {isLoading && (
        <p className="muted-text">Loading dashboard command center...</p>
      )}
      {error && <p className="form-message form-error">{error}</p>}
      <div className="stats-grid">
        <StatCard
          label="Current Mission"
          value={
            hasActiveMission
              ? formatClock(currentMission.remainingSeconds)
              : "None"
          }
          meta={currentMission?.missionTitle || "No Active Mission"}
          icon={Target}
        />
        <StatCard
          label="Today's Focus"
          value={`${analytics.todayFocusMinutes || 0}m`}
          meta="Focused minutes"
          icon={Clock}
        />
        <StatCard
          label="Weekly Focus"
          value={`${analytics.weeklyFocusHours || 0}h`}
          meta={`Best: ${analytics.bestFocusDay || "None"}`}
          icon={TimerReset}
        />
        <StatCard
          label="Active Goals"
          value={goals.activeGoals || 0}
          meta={`${goals.averageProgress || 0}% avg progress`}
          icon={Target}
        />
        <StatCard
          label="Discipline Score"
          value={`${discipline.totalXp || 0} XP`}
          meta={`Rank ${discipline.currentRank || "D"} - ${discipline.progressPercentage || 0}%`}
          icon={Gauge}
        />
        <StatCard
          label="Current Streak"
          value={`${streak.currentStreak || 0} days`}
          meta={`Best: ${streak.bestStreak || 0}`}
          icon={Flame}
        />
        <StatCard
          label="Completion Rate"
          value={`${streak.completionRate || 0}%`}
          meta={`${streak.thisWeekCompletedDays || 0} days this week`}
          icon={Activity}
        />
        <StatCard
          label="Achievements"
          value={achievements.unlockedCount || 0}
          meta={`${achievements.completionPercentage || 0}% unlocked`}
          icon={Trophy}
        />
      </div>
      <div className="content-grid two-one">
        <Card title="Weekly Focus Chart" label="Hours locked">
          <MiniBarChart
            values={(analytics.weeklyFocusTrend || []).map(
              (item) => item.hours || 0,
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
                navigate(
                  hasActiveMission ? "/active-mission" : "/mission-center",
                )
              }
            >
              {hasActiveMission ? "Continue Mission" : "Start Mission"}
            </ActionLink>
            {!quickActions.hasGoals && (
              <ActionLink onClick={() => navigate("/goals")}>
                Create Goal
              </ActionLink>
            )}
            {!quickActions.hasConsumptionLimits && (
              <ActionLink onClick={() => navigate("/consumption-control")}>
                Set Limits
              </ActionLink>
            )}
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
            <ActionLink onClick={() => navigate("/block-manager")}>
              Update Blocks
            </ActionLink>
          </div>
        </Card>
      </div>
      <Card
        title="Current Mission"
        label={hasActiveMission ? currentMission.status : "No active session"}
        action={
          <Button
            variant="secondary"
            onClick={() =>
              navigate(hasActiveMission ? "/active-mission" : "/mission-center")
            }
          >
            {hasActiveMission ? "Continue" : "Start Mission"}
          </Button>
        }
      >
        <div className="list-stack">
          <div className="card-row">
            <span>{currentMission?.missionTitle || "No mission running"}</span>
            <strong>
              {hasActiveMission
                ? formatClock(currentMission.remainingSeconds)
                : "Ready"}
            </strong>
          </div>
          <p className="muted-text">
            {currentMission?.goal ||
              "Choose a ready mission to begin a focused session."}
          </p>
          <ProgressBar value={currentMission?.progressPercentage || 0} />
        </div>
      </Card>
      <Card
        title="Monthly Review Snapshot"
        label="Current month"
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
          <ReviewStatCard label="Grade" value={monthly.grade || "F"} />
          <ReviewStatCard
            label="Score"
            value={`${monthly.monthlyScore || 0}/100`}
          />
          <ReviewStatCard label="Focus" value={`${monthly.focusHours || 0}h`} />
          <ReviewStatCard
            label="XP Earned"
            value={`+${monthly.xpEarned || 0}`}
          />
        </div>
        <p className="muted-text">{monthly.keyInsight}</p>
      </Card>
      <Card
        title="Weekly Review Snapshot"
        label="Current week"
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
          <ReviewStatCard label="Grade" value={weekly.grade || "F"} />
          <ReviewStatCard
            label="Score"
            value={`${weekly.weeklyScore || 0}/100`}
          />
          <ReviewStatCard label="Focus" value={`${weekly.focusHours || 0}h`} />
          <ReviewStatCard
            label="Success"
            value={`${weekly.completionRate || 0}%`}
          />
        </div>
        <p className="muted-text">{weekly.keyInsight}</p>
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
            value={userSummary.identityTitle || "Discipline Beginner"}
          />
          <ReviewStatCard
            label="Member Since"
            value={formatDate(userSummary.memberSince)}
          />
          <ReviewStatCard label="Email" value={userSummary.email || "-"} />
          <ReviewStatCard
            label="Full Name"
            value={userSummary.fullName || "Operator"}
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
          <ReviewStatCard label="Active Goals" value={goals.activeGoals || 0} />
          <ReviewStatCard
            label="Average Progress"
            value={`${goals.averageProgress || 0}%`}
          />
          <ReviewStatCard
            label="Completed Goals"
            value={goals.completedGoals || 0}
          />
          <ReviewStatCard
            label="Top Active Goal"
            value={goals.topActiveGoal?.title || "None"}
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
            value={achievements.unlockedCount || 0}
          />
          <ReviewStatCard
            label="Total"
            value={achievements.totalAchievements || 0}
          />
          <ReviewStatCard
            label="Completion"
            value={`${achievements.completionPercentage || 0}%`}
          />
          <ReviewStatCard
            label="Latest"
            value={achievements.latestAchievement?.title || "None yet"}
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
            label="Reels Today"
            value={consumption.reelsToday || 0}
          />
          <ReviewStatCard
            label="Shorts Today"
            value={consumption.shortsToday || 0}
          />
          <ReviewStatCard
            label="Videos Today"
            value={consumption.totalVideosToday || 0}
          />
          <ReviewStatCard
            label="Healthy Consumption"
            value={`${consumption.consumptionScore ?? 100}%`}
          />
        </div>
      </Card>
      <Card title="Mission Stats" label="Execution health">
        <div className="review-grid compact-review">
          <ReviewStatCard
            label="Total Missions"
            value={missionStats.totalMissions || 0}
          />
          <ReviewStatCard
            label="Ready"
            value={missionStats.readyMissions || 0}
          />
          <ReviewStatCard
            label="Archived"
            value={missionStats.archivedMissions || 0}
          />
          <ReviewStatCard
            label="Completed Sessions"
            value={missionStats.completedSessions || 0}
          />
          <ReviewStatCard
            label="Abandoned Sessions"
            value={missionStats.abandonedSessions || 0}
          />
          <ReviewStatCard
            label="Success Rate"
            value={`${missionStats.successRate || 0}%`}
          />
        </div>
      </Card>
      <Card title="Analytics Snapshot" label="Today and this week">
        <div className="review-grid compact-review">
          <ReviewStatCard
            label="Today Focus"
            value={`${analytics.todayFocusMinutes || 0}m`}
          />
          <ReviewStatCard
            label="Weekly Focus"
            value={`${analytics.weeklyFocusHours || 0}h`}
          />
          <ReviewStatCard
            label="Best Focus Day"
            value={analytics.bestFocusDay || "None"}
          />
          <ReviewStatCard
            label="Time Saved"
            value={analytics.totalTimeSaved || "0m"}
          />
        </div>
      </Card>
      <Card title="Recent Sessions" label="Last activity">
        <div className="list-stack">
          {recentSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={sessionCardFromHistory(session)}
            />
          ))}
          {recentSessions.length === 0 && (
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
