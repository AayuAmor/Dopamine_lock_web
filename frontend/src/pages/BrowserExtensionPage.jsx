import { Activity, Ban, Clock, Lock, RefreshCcw, ShieldCheck, Target } from "lucide-react";
import { Button, Card, PageHeader, ProgressBar, StatCard } from "../components";
import { useExtension } from "../hooks/useExtension";
import { formatClock, formatDateTime } from "./utils/formatters";

export function BrowserExtensionPage() {
  const { error, isLoading, refreshExtension, syncState } = useExtension();
  const status = syncState?.extensionStatus || {};
  const mission = syncState?.activeMission || {};
  const consumption = syncState?.consumptionStatus || {};
  const blockedCount = syncState?.effectiveBlockedWebsites?.length || 0;
  const allowedCount = syncState?.allowedWebsites?.length || 0;

  return (
    <>
      <PageHeader
        eyebrow="Browser Extension"
        title="Extension Control"
        description="Monitor connection state and synced blocking results."
        action={
          <Button
            variant="secondary"
            onClick={refreshExtension}
            disabled={isLoading}
          >
            <RefreshCcw size={15} />
            Sync State
          </Button>
        }
      />
      {isLoading && (
        <p className="muted-text">Loading extension sync state...</p>
      )}
      {error && <p className="form-message form-error">{error}</p>}
      <Card title="Extension Readiness" label="API foundation">
        <p className="muted-text">
          Browser extension API is ready. Installable extension coming soon.
        </p>
      </Card>
      <div className="stats-grid">
        <StatCard
          label="Extension Installed"
          value={status.installed ? "Installed" : "Not Installed"}
          icon={ShieldCheck}
        />
        <StatCard
          label="Extension Enabled"
          value={status.enabled ? "Enabled" : "Disabled"}
          icon={Activity}
        />
        <StatCard label="Effective Blocked" value={blockedCount} icon={Ban} />
        <StatCard label="Allowed Websites" value={allowedCount} icon={Lock} />
        <StatCard
          label="Strict Mode"
          value={syncState?.strictMode ? "Active" : "Inactive"}
          icon={Target}
        />
        <StatCard
          label="Sync Health"
          value={status.syncHealthy ? "Healthy" : "Waiting"}
          icon={Clock}
        />
      </div>
      <div className="content-grid split">
        <Card title="Connection Status" label="Future extension client">
          <div className="list-stack">
            <div className="card-row">
              <span>Browser</span>
              <strong>{status.browser || "Not connected"}</strong>
            </div>
            <div className="card-row">
              <span>Version</span>
              <strong>{status.extensionVersion || "Pending"}</strong>
            </div>
            <div className="card-row">
              <span>Last Sync</span>
              <strong>{formatDateTime(status.lastSyncAt)}</strong>
            </div>
            <div className="card-row">
              <span>Server Time</span>
              <strong>{formatDateTime(syncState?.serverTime)}</strong>
            </div>
          </div>
        </Card>
        <Card title="Active Mission State" label="Execution layer input">
          <div className="list-stack">
            <div className="card-row">
              <span>Status</span>
              <strong>
                {mission.hasActiveMission
                  ? mission.status
                  : "No Active Mission"}
              </strong>
            </div>
            <div className="card-row">
              <span>Mission</span>
              <strong>{mission.missionTitle || "None"}</strong>
            </div>
            <div className="card-row">
              <span>Remaining</span>
              <strong>{formatClock(mission.remainingSeconds || 0)}</strong>
            </div>
            <ProgressBar value={mission.completionPercentage || 0} />
          </div>
        </Card>
        <Card title="Rule Snapshot" label="Backend source of truth">
          <div className="list-stack">
            <div className="card-row">
              <span>Blocked Websites</span>
              <strong>{blockedCount}</strong>
            </div>
            <div className="card-row">
              <span>Allowed Websites</span>
              <strong>{allowedCount}</strong>
            </div>
            <div className="card-row">
              <span>Block Notifications</span>
              <strong>
                {syncState?.blockNotifications ? "Enabled" : "Disabled"}
              </strong>
            </div>
            <div className="card-row">
              <span>Prevent Tab Switching</span>
              <strong>
                {syncState?.preventTabSwitching ? "Enabled" : "Disabled"}
              </strong>
            </div>
          </div>
        </Card>
        <Card title="Consumption Lock" label="Digital wellness state">
          <div className="list-stack">
            <div className="card-row">
              <span>Strict Lock</span>
              <strong>
                {consumption.strictLockActive ? "Active" : "Inactive"}
              </strong>
            </div>
            <div className="card-row">
              <span>Warning</span>
              <strong>
                {consumption.warningReached ? "Reached" : "Clear"}
              </strong>
            </div>
            <div className="card-row">
              <span>Limit</span>
              <strong>{consumption.limitReached ? "Reached" : "Clear"}</strong>
            </div>
            <div className="card-row">
              <span>Videos Today</span>
              <strong>{consumption.todayUsage?.totalVideos || 0}</strong>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
