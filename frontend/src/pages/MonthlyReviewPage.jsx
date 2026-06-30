import { useState } from "react";
import { RefreshCcw } from "lucide-react";
import { Button, Card, PageHeader, ReviewStatCard } from "../components";
import { useMonthlyReview } from "../hooks/useMonthlyReview";

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
