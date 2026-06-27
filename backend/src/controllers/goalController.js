const {
  archiveGoal: archiveGoalById,
  completeGoal: completeGoalById,
  connectMission: connectMissionToGoal,
  createGoal: createGoalForUser,
  getGoalById,
  getGoalSummary: getGoalSummaryForUser,
  getGoalsByUserId,
  pauseGoal: pauseGoalById,
  removeMission: removeMissionFromGoal,
  resumeGoal: resumeGoalById,
  updateGoal: updateGoalById,
  updateGoalProgress: updateGoalProgressById,
} = require("../services/goalService");
const {
  allowedCategories,
  allowedPriorities,
  allowedStatuses,
} = require("../middleware/goalValidation");
const {
  checkAndUnlockAchievements,
} = require("../services/achievementService");
const {
  scheduleIdentityRecalculation,
} = require("../services/identityService");

function parsePositiveInt(value, label, res) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ message: `${label} must be a positive integer` });
    return null;
  }
  return id;
}

function parseGoalId(req, res) {
  return parsePositiveInt(req.params.id, "Goal ID", res);
}

function parseMissionId(req, res) {
  return parsePositiveInt(req.params.missionId, "Mission ID", res);
}

function parseArchived(value) {
  if (value === undefined) return undefined;
  if (value === "true" || value === true) return true;
  if (value === "false" || value === false) return false;
  return undefined;
}

function parseFilters(query) {
  const filters = {};
  if (query.status) {
    if (!allowedStatuses.has(query.status))
      return { error: "Goal status filter is invalid" };
    filters.status = query.status;
  }
  if (query.category) {
    if (!allowedCategories.has(query.category))
      return { error: "Goal category filter is invalid" };
    filters.category = query.category;
  }
  if (query.priority) {
    if (!allowedPriorities.has(query.priority))
      return { error: "Goal priority filter is invalid" };
    filters.priority = query.priority;
  }
  if (query.archived !== undefined) {
    const archived = parseArchived(query.archived);
    if (archived === undefined)
      return { error: "Archived filter must be true or false" };
    filters.archived = archived;
  }
  return { filters };
}

function handleGoalError(error, res, fallbackMessage) {
  if (error.statusCode)
    return res.status(error.statusCode).json({ message: error.message });
  console.error(fallbackMessage, error);
  return res.status(500).json({ message: fallbackMessage });
}

async function getGoals(req, res) {
  try {
    const { filters, error } = parseFilters(req.query);
    if (error) return res.status(400).json({ message: error });
    const goals = await getGoalsByUserId(req.user.id, filters);
    return res.json({ goals });
  } catch (error) {
    return handleGoalError(error, res, "Unable to load goals");
  }
}

async function getGoal(req, res) {
  try {
    const goalId = parseGoalId(req, res);
    if (!goalId) return undefined;
    const goal = await getGoalById(req.user.id, goalId);
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    return res.json({ goal });
  } catch (error) {
    return handleGoalError(error, res, "Unable to load goal");
  }
}

async function createGoal(req, res) {
  try {
    const goal = await createGoalForUser(req.user.id, req.goalData);
    return res.status(201).json({ goal });
  } catch (error) {
    return handleGoalError(error, res, "Unable to create goal");
  }
}

async function updateGoal(req, res) {
  try {
    const goalId = parseGoalId(req, res);
    if (!goalId) return undefined;
    const goal = await updateGoalById(req.user.id, goalId, req.goalData);
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    return res.json({ goal });
  } catch (error) {
    return handleGoalError(error, res, "Unable to update goal");
  }
}

async function deleteGoal(req, res) {
  try {
    const goalId = parseGoalId(req, res);
    if (!goalId) return undefined;
    const goal = await archiveGoalById(req.user.id, goalId);
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    return res.json({ goal });
  } catch (error) {
    return handleGoalError(error, res, "Unable to archive goal");
  }
}

async function updateGoalProgress(req, res) {
  try {
    const goalId = parseGoalId(req, res);
    if (!goalId) return undefined;
    const goal = await updateGoalProgressById(
      req.user.id,
      goalId,
      req.goalProgressData,
    );
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    return res.json({ goal });
  } catch (error) {
    return handleGoalError(error, res, "Unable to update goal progress");
  }
}

async function completeGoal(req, res) {
  try {
    const goalId = parseGoalId(req, res);
    if (!goalId) return undefined;
    const goal = await completeGoalById(req.user.id, goalId);
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    res.json({ goal });
    // Fire achievement check after response — non-blocking
    checkAndUnlockAchievements(req.user.id).catch((err) =>
      console.error("Achievement check failed after goal complete:", err),
    );
    scheduleIdentityRecalculation(req.user.id, "goal complete");
  } catch (error) {
    return handleGoalError(error, res, "Unable to complete goal");
  }
}

async function pauseGoal(req, res) {
  try {
    const goalId = parseGoalId(req, res);
    if (!goalId) return undefined;
    const goal = await pauseGoalById(req.user.id, goalId);
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    return res.json({ goal });
  } catch (error) {
    return handleGoalError(error, res, "Unable to pause goal");
  }
}

async function resumeGoal(req, res) {
  try {
    const goalId = parseGoalId(req, res);
    if (!goalId) return undefined;
    const goal = await resumeGoalById(req.user.id, goalId);
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    return res.json({ goal });
  } catch (error) {
    return handleGoalError(error, res, "Unable to resume goal");
  }
}

async function connectMission(req, res) {
  try {
    const goalId = parseGoalId(req, res);
    const missionId = parseMissionId(req, res);
    if (!goalId || !missionId) return undefined;
    const result = await connectMissionToGoal(req.user.id, goalId, missionId);
    if (result.notFound === "goal")
      return res.status(404).json({ message: "Goal not found" });
    if (result.notFound === "mission")
      return res.status(404).json({ message: "Mission not found" });
    return res.status(201).json({ goal: result.goal });
  } catch (error) {
    return handleGoalError(error, res, "Unable to connect mission");
  }
}

async function removeMission(req, res) {
  try {
    const goalId = parseGoalId(req, res);
    const missionId = parseMissionId(req, res);
    if (!goalId || !missionId) return undefined;
    const result = await removeMissionFromGoal(req.user.id, goalId, missionId);
    if (result.notFound === "goal")
      return res.status(404).json({ message: "Goal not found" });
    if (result.notFound === "mission")
      return res.status(404).json({ message: "Mission not found" });
    return res.json({ goal: result.goal });
  } catch (error) {
    return handleGoalError(error, res, "Unable to remove mission from goal");
  }
}

async function getGoalSummary(req, res) {
  try {
    const summary = await getGoalSummaryForUser(req.user.id);
    return res.json({ summary });
  } catch (error) {
    return handleGoalError(error, res, "Unable to load goal summary");
  }
}

module.exports = {
  completeGoal,
  connectMission,
  createGoal,
  deleteGoal,
  getGoal,
  getGoalSummary,
  getGoals,
  pauseGoal,
  removeMission,
  resumeGoal,
  updateGoal,
  updateGoalProgress,
};
