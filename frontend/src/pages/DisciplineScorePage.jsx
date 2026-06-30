import { useMemo, useState } from "react";
import { RefreshCcw } from "lucide-react";
import { Badge, Button, Card, LineChartMock, ProgressBar } from "../components";
import { useDisciplineScore } from "../hooks/useDisciplineScore";
import { recalculateScore } from "../services/disciplineScoreService";

const disciplineRankLadder = ["D", "C", "B", "A", "S", "S+"];

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
