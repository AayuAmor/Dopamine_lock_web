import { Card, PageHeader, ReviewStatCard, UserAvatar } from "../components";
import { useAuth } from "../context/useAuth";
import { formatMemberSince } from "./utils/formatters";

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
