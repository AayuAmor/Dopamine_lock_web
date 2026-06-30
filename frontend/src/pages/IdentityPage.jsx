import { useState } from "react";
import {
  Activity,
  CheckCircle2,
  Clock,
  Flame,
  Gauge,
  RefreshCcw,
  Target,
  Trophy,
} from "lucide-react";
import { Button, Card, ProgressBar, StatCard, UserAvatar } from "../components";
import { useAuth } from "../context/useAuth";
import { useIdentity } from "../hooks/useIdentity";
import { recalculate as recalculateIdentity } from "../services/identityService";
import { formatDate, formatMemberSince } from "./utils/formatters";

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
