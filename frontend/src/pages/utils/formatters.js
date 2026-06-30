export function formatMemberSince(value) {
  if (!value) {
    return "Member since unknown";
  }

  return `Member since ${new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(value))}`;
}

export function formatDate(value) {
  if (!value) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatClock(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

export function formatDuration(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

export function formatTime(value) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatDateTime(value) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function sessionTimelineGroup(value) {
  if (!value) {
    return "Earlier";
  }

  const sessionDate = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(
    today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1),
  );

  if (sessionDate.toDateString() === today.toDateString()) {
    return "Today";
  }

  if (sessionDate.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  if (sessionDate >= weekStart) {
    return "This Week";
  }

  return "Earlier";
}

export function sessionCardFromHistory(session) {
  return {
    id: session.id,
    date: sessionTimelineGroup(session.endedAt),
    duration: `${session.actualDurationMinutes || Math.round(session.elapsedSeconds / 60)} min`,
    status: session.status === "COMPLETED" ? "Completed" : "Abandoned",
    time: `${formatTime(session.startedAt)} - ${formatTime(session.endedAt)}`,
    title: session.mission?.title || "Untitled Mission",
    xp: `${session.completionPercentage}%`,
  };
}
