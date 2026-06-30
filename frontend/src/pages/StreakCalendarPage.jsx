import { useState } from "react";
import { Activity, Flame, Trophy } from "lucide-react";
import { Button, CalendarGrid, Card, PageHeader, ProgressBar, StatCard } from "../components";
import { useStreak } from "../hooks/useStreak";

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
