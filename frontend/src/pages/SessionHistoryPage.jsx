import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, Target, Trophy } from "lucide-react";
import { Badge, Button, Card, Input, PageHeader, Select, SessionCard, StatCard } from "../components";
import { useSessionHistory } from "../hooks/useSessionHistory";
import { getSession as getHistorySession } from "../services/sessionHistoryService";
import { ProfileDetail } from "./shared/ProfileDetail";
import {
  formatDateTime,
  formatDuration,
  sessionCardFromHistory,
  sessionTimelineGroup,
} from "./utils/formatters";

const sessionFilters = [
  "All",
  "Completed",
  "Abandoned",
  "Today",
  "This Week",
  "This Month",
];
const sessionSorts = [
  "Newest",
  "Oldest",
  "Duration",
  "Completion Time",
  "Mission Name",
];

export function SessionHistoryPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sort, setSort] = useState("Newest");
  const [error, setError] = useState("");
  const {
    error: loadError,
    history,
    isLoading,
    summary,
  } = useSessionHistory({
    filter,
    limit: 10,
    page,
    search: debouncedQuery,
    sort,
  });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  const grouped = useMemo(
    () =>
      history.items.reduce((groups, session) => {
        const group = sessionTimelineGroup(session.endedAt);
        groups[group] = [...(groups[group] || []), session];
        return groups;
      }, {}),
    [history.items],
  );

  const handleSelectSession = async (sessionId) => {
    try {
      setError("");
      setSelectedSession(await getHistorySession(sessionId));
    } catch (selectError) {
      setError(selectError.message);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Session History"
        title="Audit Focus Sessions"
        description="Search the timeline and inspect completion quality."
      />
      {(error || loadError) && (
        <p className="form-error">{error || loadError}</p>
      )}
      <div className="stats-grid">
        <StatCard
          label="Total Focus Hours"
          value={`${summary?.totalFocusHours || 0}h`}
          meta="Historical total"
          icon={Clock}
        />
        <StatCard
          label="Total Sessions"
          value={summary?.totalSessions || 0}
          meta={`${summary?.currentWeekSessions || 0} this week`}
          icon={Target}
        />
        <StatCard
          label="Success Rate"
          value={`${summary?.successRate || 0}%`}
          meta={`${summary?.completedSessions || 0} completed`}
          icon={CheckCircle2}
        />
        <StatCard
          label="Average Duration"
          value={formatDuration(summary?.averageSessionDuration || 0)}
          meta="Per session"
          icon={Trophy}
        />
      </div>
      <div className="toolbar">
        <Input
          label="Search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search sessions"
        />
        <Select
          label="Filters"
          value={filter}
          onChange={(event) => {
            setFilter(event.target.value);
            setPage(1);
          }}
        >
          {sessionFilters.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </Select>
        <Select
          label="Sort"
          value={sort}
          onChange={(event) => {
            setSort(event.target.value);
            setPage(1);
          }}
        >
          {sessionSorts.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </Select>
      </div>
      {Object.entries(grouped).map(([date, dateSessions]) => (
        <Card title={date} label="Timeline grouped by date" key={date}>
          <div className="list-stack">
            {dateSessions.map((session) => (
              <div className="compact-row" key={session.id}>
                <SessionCard session={sessionCardFromHistory(session)} />
                <Button
                  variant="secondary"
                  onClick={() => handleSelectSession(session.id)}
                >
                  Details
                </Button>
              </div>
            ))}
          </div>
        </Card>
      ))}
      {!isLoading && history.items.length === 0 && (
        <Card title="No Sessions" label="History">
          <p className="muted-text">
            No completed or abandoned sessions match this view.
          </p>
        </Card>
      )}
      <div className="splash-actions">
        <Button
          variant="secondary"
          disabled={page <= 1}
          onClick={() => setPage((current) => Math.max(1, current - 1))}
        >
          Previous
        </Button>
        <Badge label={`Page ${history.page} / ${history.totalPages}`} />
        <Button
          variant="secondary"
          disabled={page >= history.totalPages}
          onClick={() => setPage((current) => current + 1)}
        >
          Next
        </Button>
      </div>
      {selectedSession && (
        <Card title="Session Details" label={selectedSession.status}>
          <div className="profile-details">
            <ProfileDetail
              label="Mission Name"
              value={selectedSession.mission?.title}
            />
            <ProfileDetail label="Goal" value={selectedSession.mission?.goal} />
            <ProfileDetail
              label="Description"
              value={selectedSession.mission?.description || "No description"}
            />
            <ProfileDetail
              label="Duration"
              value={`${selectedSession.plannedDurationMinutes || selectedSession.mission?.durationMinutes || 0} minutes planned`}
            />
            <ProfileDetail
              label="Actual Duration"
              value={`${selectedSession.actualDurationMinutes || Math.round(selectedSession.elapsedSeconds / 60)} minutes`}
            />
            <ProfileDetail
              label="Completion Status"
              value={selectedSession.status}
            />
            <ProfileDetail
              label="Blocked Websites"
              value={
                (selectedSession.mission?.blockedWebsites || []).join(", ") ||
                "None"
              }
            />
            <ProfileDetail
              label="Started At"
              value={formatDateTime(selectedSession.startedAt)}
            />
            <ProfileDetail
              label="Ended At"
              value={formatDateTime(selectedSession.endedAt)}
            />
            <ProfileDetail
              label="Completion Reason"
              value={selectedSession.completionReason || "Not set"}
            />
            <ProfileDetail
              label="Notes"
              value={selectedSession.notes || "No notes"}
            />
          </div>
        </Card>
      )}
    </>
  );
}
