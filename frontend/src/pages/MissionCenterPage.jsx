import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Archive, Edit3, Play, Plus, Star, Trash2 } from "lucide-react";
import { Badge, Button, Card, Input, PageHeader, Select } from "../components";
import { useMissionSession } from "../hooks/useMissionSession";
import { useMissions } from "../hooks/useMissions";
import {
  archiveMission,
  createMission,
  deleteMission,
  toggleFavorite,
  updateMission,
} from "../services/missionService";
import { startMission } from "../services/missionSessionService";
import { formatDate } from "./utils/formatters";

const missionRules = [
  "Strict mode",
  "Block all notifications",
  "Prevent tab switching",
];
const missionFilters = [
  "All",
  "Favorites",
  "Archived",
  "Easy",
  "Medium",
  "Hard",
];
const missionSorts = [
  "Newest",
  "Oldest",
  "Alphabetical",
  "Duration",
  "Difficulty",
];
const defaultMissionForm = {
  title: "",
  goal: "",
  description: "",
  durationMinutes: "",
  difficulty: "Hard",
  blockedWebsites: "",
  allowedWebsites: "",
  blockedCategories: "",
  strictMode: true,
  blockNotifications: true,
  preventTabSwitching: true,
  status: "Ready",
};

function parseList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function missionFormFromMission(mission) {
  if (!mission) {
    return { ...defaultMissionForm };
  }

  return {
    title: mission.title || "",
    goal: mission.goal || "",
    description: mission.description || "",
    durationMinutes: mission.durationMinutes || "",
    difficulty: mission.difficulty || "Hard",
    blockedWebsites: (mission.blockedWebsites || []).join(", "),
    allowedWebsites: (mission.allowedWebsites || []).join(", "),
    blockedCategories: (mission.blockedCategories || []).join(", "),
    strictMode: mission.strictMode,
    blockNotifications: mission.blockNotifications,
    preventTabSwitching: mission.preventTabSwitching,
    status: mission.status || "Ready",
  };
}

function missionPayloadFromForm(form) {
  return {
    title: form.title,
    goal: form.goal,
    description: form.description,
    durationMinutes: Number(form.durationMinutes),
    difficulty: form.difficulty,
    blockedWebsites: parseList(form.blockedWebsites),
    allowedWebsites: parseList(form.allowedWebsites),
    blockedCategories: parseList(form.blockedCategories),
    strictMode: form.strictMode,
    blockNotifications: form.blockNotifications,
    preventTabSwitching: form.preventTabSwitching,
    status: form.status,
  };
}

export function MissionCenterPage() {
  const navigate = useNavigate();
  const {
    error: loadError,
    isLoading,
    missions: userMissions,
    refreshMissions,
  } = useMissions();
  const { refreshSession, session: currentSession } = useMissionSession();
  const [form, setForm] = useState(() => ({ ...defaultMissionForm }));
  const [editingMissionId, setEditingMissionId] = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("Newest");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const filteredMissions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...userMissions]
      .filter((mission) => {
        if (filter === "Favorites") {
          return mission.favorite && !mission.archived;
        }

        if (filter === "Archived") {
          return mission.archived;
        }

        if (["Easy", "Medium", "Hard"].includes(filter)) {
          return mission.difficulty === filter && !mission.archived;
        }

        return !mission.archived;
      })
      .filter((mission) => {
        if (!normalizedQuery) {
          return true;
        }

        return [mission.title, mission.goal, mission.description]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedQuery));
      })
      .sort((a, b) => {
        if (sort === "Oldest") {
          return new Date(a.createdAt) - new Date(b.createdAt);
        }

        if (sort === "Alphabetical") {
          return a.title.localeCompare(b.title);
        }

        if (sort === "Duration") {
          return a.durationMinutes - b.durationMinutes;
        }

        if (sort === "Difficulty") {
          const weights = { Easy: 1, Medium: 2, Hard: 3 };
          return weights[a.difficulty] - weights[b.difficulty];
        }

        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }, [filter, query, sort, userMissions]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const validateMissionForm = () => {
    if (!form.title.trim()) {
      return "Mission title is required";
    }

    if (!form.goal.trim()) {
      return "Goal is required";
    }

    if (
      !Number.isFinite(Number(form.durationMinutes)) ||
      Number(form.durationMinutes) <= 0
    ) {
      return "Duration must be a positive number";
    }

    if (!["Easy", "Medium", "Hard"].includes(form.difficulty)) {
      return "Difficulty must be Easy, Medium, or Hard";
    }

    return "";
  };

  const resetForm = () => {
    setForm({ ...defaultMissionForm });
    setEditingMissionId(null);
    setError("");
    setSuccess("");
  };

  const handleSaveMission = async () => {
    const validationError = validateMissionForm();

    if (validationError) {
      setError(validationError);
      setSuccess("");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      const payload = missionPayloadFromForm(form);

      if (editingMissionId) {
        await updateMission(editingMissionId, payload);
        setSuccess("Mission updated");
      } else {
        await createMission(payload);
        setSuccess("Mission created");
      }

      await refreshMissions();
      setForm({ ...defaultMissionForm });
      setEditingMissionId(null);
    } catch (saveError) {
      setError(saveError.message);
      setSuccess("");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditMission = (mission) => {
    setForm(missionFormFromMission(mission));
    setEditingMissionId(mission.id);
    setError("");
    setSuccess("");
  };

  const handleMissionAction = async (action, successMessage) => {
    try {
      setError("");
      await action();
      await refreshMissions();
      setSuccess(successMessage);
    } catch (actionError) {
      setError(actionError.message);
      setSuccess("");
    }
  };

  const handleStartMission = async (mission) => {
    try {
      setError("");
      await startMission(mission.id);
      await refreshSession();
      setSuccess("Mission started");
      navigate("/active-mission");
    } catch (startError) {
      setError(startError.message);
      setSuccess("");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Mission Center"
        title="Create Focus Mission"
        description="Define the objective, constraints, and resistance protocol."
      />
      {(error || loadError || success) && (
        <p className={error || loadError ? "form-error" : "form-success"}>
          {error || loadError || success}
        </p>
      )}
      {currentSession && (
        <p className="form-error">
          Finish your current mission before starting another.
        </p>
      )}
      <div className="content-grid split">
        <Card title="Create Mission Form" label="Mission design">
          <div className="form-grid">
            <Input
              label="Mission name"
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="Deep Work: DSA Blocks"
            />
            <Input
              label="Goal"
              value={form.goal}
              onChange={(event) => updateField("goal", event.target.value)}
              placeholder="Complete graph traversal drills"
            />
            <Input
              label="Duration"
              type="number"
              min="1"
              value={form.durationMinutes}
              onChange={(event) =>
                updateField("durationMinutes", event.target.value)
              }
              placeholder="90 minutes"
            />
            <Select
              label="Difficulty"
              value={form.difficulty}
              onChange={(event) =>
                updateField("difficulty", event.target.value)
              }
            >
              {["Easy", "Medium", "Hard"].map((difficulty) => (
                <option key={difficulty}>{difficulty}</option>
              ))}
            </Select>
            <label className="field form-span-full">
              <span>Description</span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                placeholder="Optional mission context"
              />
            </label>
            <Input
              label="Blocked websites"
              value={form.blockedWebsites}
              onChange={(event) =>
                updateField("blockedWebsites", event.target.value)
              }
              placeholder="youtube.com, x.com"
            />
            <Input
              label="Allowed websites"
              value={form.allowedWebsites}
              onChange={(event) =>
                updateField("allowedWebsites", event.target.value)
              }
              placeholder="leetcode.com, github.com"
            />
            <Input
              label="Blocked categories"
              value={form.blockedCategories}
              onChange={(event) =>
                updateField("blockedCategories", event.target.value)
              }
              placeholder="Social, Video, Gaming"
            />
            <Select
              label="Status"
              value={form.status}
              onChange={(event) => updateField("status", event.target.value)}
            >
              {["Draft", "Ready"].map((status) => (
                <option key={status}>{status}</option>
              ))}
            </Select>
          </div>
          <div className="toggle-list">
            <label>
              <input
                type="checkbox"
                checked={form.strictMode}
                onChange={(event) =>
                  updateField("strictMode", event.target.checked)
                }
              />{" "}
              Strict Mode
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.blockNotifications}
                onChange={(event) =>
                  updateField("blockNotifications", event.target.checked)
                }
              />{" "}
              Block Notifications
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.preventTabSwitching}
                onChange={(event) =>
                  updateField("preventTabSwitching", event.target.checked)
                }
              />{" "}
              Prevent Tab Switching
            </label>
          </div>
          <div className="splash-actions">
            <Button onClick={handleSaveMission} disabled={isSaving}>
              <Plus size={15} />
              {isSaving
                ? "Saving Mission"
                : editingMissionId
                  ? "Save Mission"
                  : "Create Mission"}
            </Button>
            <Button variant="secondary" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </Card>
        <Card
          title="Mission List"
          label={
            isLoading ? "Loading missions" : `${filteredMissions.length} shown`
          }
        >
          <div className="form-grid mission-controls">
            <Input
              label="Search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search missions"
            />
            <Select
              label="Filter"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              {missionFilters.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
            <Select
              label="Sort"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              {missionSorts.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
          </div>
          <div className="list-stack">
            {filteredMissions.map((mission) => (
              <MissionListItem
                key={mission.id}
                mission={mission}
                onArchive={() =>
                  handleMissionAction(
                    () => archiveMission(mission.id, !mission.archived),
                    mission.archived ? "Mission restored" : "Mission archived",
                  )
                }
                onDelete={() =>
                  handleMissionAction(
                    () => deleteMission(mission.id),
                    "Mission deleted",
                  )
                }
                onEdit={() => handleEditMission(mission)}
                onFavorite={() =>
                  handleMissionAction(
                    () => toggleFavorite(mission.id),
                    "Favorite updated",
                  )
                }
                onStart={() => handleStartMission(mission)}
                startDisabled={Boolean(currentSession) || mission.archived}
              />
            ))}
            {!isLoading && filteredMissions.length === 0 && (
              <p className="muted-text">No missions match the current view.</p>
            )}
          </div>
        </Card>
      </div>
      <Card title="Mission Rules" label="Default protection">
        <div className="badge-row">
          {missionRules.map((rule) => (
            <Badge key={rule} label={rule} />
          ))}
        </div>
      </Card>
    </>
  );
}

function MissionListItem({
  mission,
  onArchive,
  onDelete,
  onEdit,
  onFavorite,
  onStart,
  startDisabled,
}) {
  return (
    <article className="mission-list-item">
      <div className="mission-list-main">
        <div>
          <strong>{mission.title}</strong>
          <span>{mission.goal}</span>
          {mission.description && <p>{mission.description}</p>}
        </div>
        <div className="badge-row">
          <Badge label={mission.difficulty} />
          <Badge
            label={mission.status}
            tone={mission.archived ? "muted" : "default"}
          />
        </div>
      </div>
      <div className="mission-list-meta">
        <span>{mission.durationMinutes} minutes</span>
        <span>Created {formatDate(mission.createdAt)}</span>
      </div>
      <div className="mission-actions">
        <Button disabled={startDisabled} onClick={onStart}>
          <Play size={15} />
          Start Mission
        </Button>
        <Button variant="secondary" onClick={onEdit}>
          <Edit3 size={15} />
          Edit
        </Button>
        <Button variant="secondary" onClick={onFavorite}>
          <Star size={15} />
          {mission.favorite ? "Unfavorite" : "Favorite"}
        </Button>
        <Button variant="secondary" onClick={onArchive}>
          <Archive size={15} />
          {mission.archived ? "Restore" : "Archive"}
        </Button>
        <Button variant="danger" onClick={onDelete}>
          <Trash2 size={15} />
          Delete
        </Button>
      </div>
    </article>
  );
}
