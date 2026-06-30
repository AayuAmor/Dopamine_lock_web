import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Ban, CheckCircle2, Clock, Gauge, Lock, Pause, Play, Target } from "lucide-react";
import { Badge, Button, Card, PageHeader, ProgressBar, StatCard } from "../components";
import { useBlockManager } from "../hooks/useBlockManager";
import { useMissionSession } from "../hooks/useMissionSession";
import {
  abandonMission,
  completeMission,
  pauseMission,
  resumeMission,
} from "../services/missionSessionService";
import { ProfileDetail } from "./shared/ProfileDetail";
import { formatClock, formatDuration, formatTime } from "./utils/formatters";

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
