import { useState } from "react";
import { Archive, CheckCircle2, Edit3, Pause, Play, Plus } from "lucide-react";
import { Button, Card, Input, PageHeader, ProgressBar, ReviewStatCard, Select } from "../components";
import { useGoals } from "../hooks/useGoals";
import { useMissions } from "../hooks/useMissions";
import {
  archiveGoal,
  completeGoal as completeGoalById,
  connectMission,
  createGoal,
  pauseGoal,
  removeMission,
  resumeGoal,
  updateGoal,
  updateGoalProgress,
} from "../services/goalService";
import { formatDate } from "./utils/formatters";

const goalCategories = [
  "STUDY",
  "CODING",
  "FITNESS",
  "READING",
  "PROJECT",
  "DIGITAL_DETOX",
  "CONSISTENCY",
  "CUSTOM",
];
const goalPriorities = ["LOW", "MEDIUM", "HIGH"];
const defaultGoalForm = {
  title: "",
  description: "",
  category: "STUDY",
  priority: "MEDIUM",
  targetValue: "",
  currentValue: "0",
  unit: "sessions",
  targetDate: "",
};

export function GoalsHubPage() {
  const {
    goals: userGoals,
    summary,
    error: loadError,
    isLoading,
    refreshGoals,
  } = useGoals();
  const { missions: userMissions } = useMissions();
  const [form, setForm] = useState(defaultGoalForm);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [progressGoalId, setProgressGoalId] = useState(null);
  const [progressValue, setProgressValue] = useState(0);
  const [selectedMissionByGoal, setSelectedMissionByGoal] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const activeMissions = userMissions.filter((mission) => !mission.archived);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const goalPayloadFromForm = () => ({
    title: form.title,
    description: form.description,
    category: form.category,
    priority: form.priority,
    targetValue: form.targetValue === "" ? undefined : Number(form.targetValue),
    currentValue: form.currentValue === "" ? 0 : Number(form.currentValue),
    unit: form.unit,
    targetDate: form.targetDate || undefined,
  });

  const resetGoalForm = () => {
    setForm(defaultGoalForm);
    setEditingGoalId(null);
  };

  const handleSaveGoal = async () => {
    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = goalPayloadFromForm();
      if (editingGoalId) {
        await updateGoal(editingGoalId, payload);
        setMessage("Goal updated.");
      } else {
        await createGoal(payload);
        setMessage("Goal created.");
      }
      resetGoalForm();
      await refreshGoals();
    } catch (saveError) {
      setError(saveError.message || "Unable to save goal");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditGoal = (goal) => {
    setEditingGoalId(goal.id);
    setForm({
      title: goal.title || "",
      description: goal.description || "",
      category: goal.category || "STUDY",
      priority: goal.priority || "MEDIUM",
      targetValue: goal.targetValue ?? "",
      currentValue: goal.currentValue ?? 0,
      unit: goal.unit || "sessions",
      targetDate: goal.targetDate ? goal.targetDate.slice(0, 10) : "",
    });
  };

  const handleGoalAction = async (action, successText) => {
    setError("");
    setMessage("");
    try {
      await action();
      setMessage(successText);
      await refreshGoals();
    } catch (actionError) {
      setError(actionError.message || "Goal action failed");
    }
  };

  const handleProgressSave = (goal) => {
    handleGoalAction(
      () =>
        updateGoalProgress(goal.id, { currentValue: Number(progressValue) }),
      "Goal progress updated.",
    );
    setProgressGoalId(null);
  };

  const formatGoalDate = (goal) => {
    if (!goal.targetDate) return "No target date";
    return formatDate(goal.targetDate);
  };

  return (
    <>
      <PageHeader
        eyebrow="Goals Hub"
        title="Long-Term Goals"
        description="Connect strategic goals to repeatable focus missions."
        action={
          <Button onClick={resetGoalForm}>
            <Plus size={15} />
            Add New Goal
          </Button>
        }
      />

      <div className="review-grid compact-review">
        <ReviewStatCard
          label="Active Goals"
          value={summary?.activeGoals || 0}
        />
        <ReviewStatCard
          label="Completed Goals"
          value={summary?.completedGoals || 0}
        />
        <ReviewStatCard
          label="Average Progress"
          value={`${summary?.averageProgress || 0}%`}
        />
        <ReviewStatCard
          label="High Priority"
          value={summary?.highPriorityGoals || 0}
        />
      </div>

      <Card
        title={editingGoalId ? "Edit Goal" : "Create Goal"}
        label="Long-term outcome"
      >
        <div className="form-grid">
          <Input
            label="Title"
            value={form.title}
            onChange={(event) => updateField("title", event.target.value)}
          />
          <Input
            label="Description"
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
          />
          <Select
            label="Category"
            value={form.category}
            onChange={(event) => updateField("category", event.target.value)}
          >
            {goalCategories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </Select>
          <Select
            label="Priority"
            value={form.priority}
            onChange={(event) => updateField("priority", event.target.value)}
          >
            {goalPriorities.map((priority) => (
              <option key={priority}>{priority}</option>
            ))}
          </Select>
          <Input
            label="Target Value"
            type="number"
            min="1"
            value={form.targetValue}
            onChange={(event) => updateField("targetValue", event.target.value)}
          />
          <Input
            label="Current Value"
            type="number"
            min="0"
            value={form.currentValue}
            onChange={(event) =>
              updateField("currentValue", event.target.value)
            }
          />
          <Input
            label="Unit"
            value={form.unit}
            onChange={(event) => updateField("unit", event.target.value)}
            placeholder="topics, books, sessions"
          />
          <Input
            label="Target Date"
            type="date"
            value={form.targetDate}
            onChange={(event) => updateField("targetDate", event.target.value)}
          />
        </div>
        <div className="button-row">
          <Button onClick={handleSaveGoal} disabled={isSaving}>
            {isSaving
              ? "Saving..."
              : editingGoalId
                ? "Update Goal"
                : "Create Goal"}
          </Button>
          {editingGoalId && (
            <Button variant="secondary" onClick={resetGoalForm}>
              Cancel Edit
            </Button>
          )}
        </div>
        {(error || loadError) && (
          <p className="error-text">{error || loadError}</p>
        )}
        {message && <p className="success-text">{message}</p>}
      </Card>

      {isLoading && <p className="muted-text">Loading goals...</p>}
      {!isLoading && userGoals.length === 0 && (
        <Card title="No goals yet" label="Start with one strategic outcome">
          <p className="muted-text">
            Create your first long-term goal and connect it to focus missions.
          </p>
        </Card>
      )}

      <div className="card-grid">
        {userGoals.map((goal) => (
          <Card
            key={goal.id}
            title={goal.title}
            label={`${goal.missions || 0} connected missions`}
          >
            <ProgressBar value={goal.progressPercentage || 0} />
            <div className="card-row">
              <span>Progress</span>
              <strong>{goal.progressPercentage || 0}%</strong>
            </div>
            <div className="card-row">
              <span>Category</span>
              <strong>{goal.category}</strong>
            </div>
            <div className="card-row">
              <span>Priority</span>
              <strong>{goal.priority}</strong>
            </div>
            <div className="card-row">
              <span>Status</span>
              <strong>{goal.status}</strong>
            </div>
            <div className="card-row">
              <span>Target</span>
              <strong>
                {goal.targetValue
                  ? `${goal.currentValue}/${goal.targetValue} ${goal.unit || ""}`
                  : goal.unit || "Manual"}
              </strong>
            </div>
            <div className="card-row">
              <span>Target Date</span>
              <strong>{formatGoalDate(goal)}</strong>
            </div>
            {goal.description && (
              <p className="muted-text">{goal.description}</p>
            )}

            <div className="list-stack">
              <p className="eyebrow">Connected Missions</p>
              {(goal.connectedMissions || []).map((mission) => (
                <div className="card-row" key={mission.id}>
                  <span>{mission.title}</span>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      handleGoalAction(
                        () => removeMission(goal.id, mission.id),
                        "Mission removed from goal.",
                      )
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))}
              {(goal.connectedMissions || []).length === 0 && (
                <p className="muted-text">
                  {activeMissions.length
                    ? "No missions connected yet."
                    : "Create missions first to connect them with this goal."}
                </p>
              )}
              {activeMissions.length > 0 && (
                <div className="button-row">
                  <Select
                    label="Connect Mission"
                    value={selectedMissionByGoal[goal.id] || ""}
                    onChange={(event) =>
                      setSelectedMissionByGoal((current) => ({
                        ...current,
                        [goal.id]: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select mission</option>
                    {activeMissions.map((mission) => (
                      <option key={mission.id} value={mission.id}>
                        {mission.title}
                      </option>
                    ))}
                  </Select>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      selectedMissionByGoal[goal.id] &&
                      handleGoalAction(
                        () =>
                          connectMission(
                            goal.id,
                            selectedMissionByGoal[goal.id],
                          ),
                        "Mission connected to goal.",
                      )
                    }
                  >
                    Connect
                  </Button>
                </div>
              )}
            </div>

            {progressGoalId === goal.id && (
              <div className="button-row">
                <Input
                  label={`Current ${goal.unit || "value"}`}
                  type="number"
                  min="0"
                  value={progressValue}
                  onChange={(event) => setProgressValue(event.target.value)}
                />
                <Button onClick={() => handleProgressSave(goal)}>
                  Save Progress
                </Button>
              </div>
            )}

            <div className="button-row">
              <Button variant="secondary" onClick={() => handleEditGoal(goal)}>
                <Edit3 size={14} />
                Edit
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setProgressGoalId(goal.id);
                  setProgressValue(goal.currentValue || 0);
                }}
              >
                Update Progress
              </Button>
              {goal.status !== "COMPLETED" && (
                <Button
                  variant="secondary"
                  onClick={() =>
                    handleGoalAction(
                      () => completeGoalById(goal.id),
                      "Goal completed.",
                    )
                  }
                >
                  <CheckCircle2 size={14} />
                  Complete
                </Button>
              )}
              {goal.status === "PAUSED" ? (
                <Button
                  variant="secondary"
                  onClick={() =>
                    handleGoalAction(() => resumeGoal(goal.id), "Goal resumed.")
                  }
                >
                  <Play size={14} />
                  Resume
                </Button>
              ) : goal.status === "ACTIVE" ? (
                <Button
                  variant="secondary"
                  onClick={() =>
                    handleGoalAction(() => pauseGoal(goal.id), "Goal paused.")
                  }
                >
                  <Pause size={14} />
                  Pause
                </Button>
              ) : null}
              {!goal.archived && (
                <Button
                  variant="secondary"
                  onClick={() =>
                    handleGoalAction(
                      () => archiveGoal(goal.id),
                      "Goal archived.",
                    )
                  }
                >
                  <Archive size={14} />
                  Archive
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
