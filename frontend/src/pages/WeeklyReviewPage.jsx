import { useState } from "react";
import { RefreshCcw } from "lucide-react";
import { Button, Card, PageHeader, ReviewStatCard } from "../components";
import { useWeeklyReview } from "../hooks/useWeeklyReview";

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
