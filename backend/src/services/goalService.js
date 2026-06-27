const prisma = require("../config/prisma");

const goalOrder = [
  { archived: "asc" },
  { status: "asc" },
  { priority: "desc" },
  { targetDate: "asc" },
  { createdAt: "desc" },
];

function clampProgress(value) {
  return Math.max(0, Math.min(100, Math.round(value || 0)));
}

function calculateProgress({
  currentValue = 0,
  targetValue,
  progressPercentage = 0,
}) {
  if (targetValue !== undefined && targetValue !== null) {
    return clampProgress(
      (Number(currentValue || 0) / Number(targetValue)) * 100,
    );
  }
  return clampProgress(progressPercentage);
}

function normalizeGoalData(
  data,
  existing = {},
  { skipProgressCalc = false } = {},
) {
  const next = { ...data };

  if (skipProgressCalc) {
    // Direct status/field override (e.g. archive, complete) — no recalculation
    return next;
  }

  const targetValue =
    next.targetValue !== undefined ? next.targetValue : existing.targetValue;
  const currentValue =
    next.currentValue !== undefined
      ? next.currentValue
      : existing.currentValue || 0;

  if (
    targetValue !== undefined &&
    targetValue !== null &&
    currentValue > targetValue
  ) {
    const error = new Error("Current value cannot exceed target value");
    error.statusCode = 400;
    throw error;
  }

  next.progressPercentage = calculateProgress({
    currentValue,
    targetValue,
    progressPercentage:
      next.progressPercentage !== undefined
        ? next.progressPercentage
        : existing.progressPercentage || 0,
  });

  // Only auto-complete if not explicitly being set to another status
  const requestedStatus = next.status;
  if (
    next.progressPercentage >= 100 &&
    requestedStatus !== "PAUSED" &&
    requestedStatus !== "ARCHIVED"
  ) {
    next.status = "COMPLETED";
    next.completedAt = existing.completedAt || new Date();
    next.archived = false;
  } else if (requestedStatus === "COMPLETED") {
    next.progressPercentage = 100;
    next.completedAt = existing.completedAt || new Date();
  } else if (requestedStatus && requestedStatus !== "COMPLETED") {
    next.completedAt = null;
  }

  if (next.status === "ARCHIVED") next.archived = true;
  return next;
}

function formatMission(mission) {
  return {
    id: mission.id,
    title: mission.title,
    goal: mission.goal,
    description: mission.description,
    durationMinutes: mission.durationMinutes,
    difficulty: mission.difficulty,
    status: mission.status,
    archived: mission.archived,
  };
}

function formatGoal(goal) {
  const connectedMissions = (goal.goalMissions || []).map((item) =>
    formatMission(item.mission),
  );
  return {
    id: goal.id,
    userId: goal.userId,
    title: goal.title,
    description: goal.description,
    category: goal.category,
    targetValue: goal.targetValue,
    currentValue: goal.currentValue,
    unit: goal.unit,
    progressPercentage: goal.progressPercentage,
    progress: goal.progressPercentage,
    priority: goal.priority,
    status: goal.status,
    targetDate: goal.targetDate,
    completedAt: goal.completedAt,
    archived: goal.archived,
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt,
    connectedMissions,
    missions: connectedMissions.length,
  };
}

function buildGoalWhere(userId, filters = {}) {
  const where = { userId };
  if (filters.status) where.status = filters.status;
  if (filters.category) where.category = filters.category;
  if (filters.priority) where.priority = filters.priority;
  if (filters.archived !== undefined) where.archived = filters.archived;
  return where;
}

async function getGoalsByUserId(userId, filters = {}) {
  const goals = await prisma.goal.findMany({
    where: buildGoalWhere(userId, filters),
    include: { goalMissions: { include: { mission: true } } },
    orderBy: goalOrder,
  });
  return goals.map(formatGoal);
}

async function getGoalById(userId, goalId) {
  const goal = await prisma.goal.findFirst({
    where: { id: goalId, userId },
    include: {
      goalMissions: {
        include: { mission: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  return goal ? formatGoal(goal) : null;
}

async function createGoal(userId, data) {
  const goal = await prisma.goal.create({
    data: { ...normalizeGoalData(data), userId },
    include: { goalMissions: { include: { mission: true } } },
  });
  return formatGoal(goal);
}

async function updateGoal(userId, goalId, data) {
  const existing = await prisma.goal.findFirst({
    where: { id: goalId, userId },
  });
  if (!existing) return null;
  const goal = await prisma.goal.update({
    where: { id: goalId },
    data: normalizeGoalData(data, existing),
    include: { goalMissions: { include: { mission: true } } },
  });
  return formatGoal(goal);
}

async function archiveGoal(userId, goalId) {
  const existing = await prisma.goal.findFirst({
    where: { id: goalId, userId },
  });
  if (!existing) return null;
  const goal = await prisma.goal.update({
    where: { id: goalId },
    data: { archived: true, status: "ARCHIVED", completedAt: null },
    include: { goalMissions: { include: { mission: true } } },
  });
  return formatGoal(goal);
}

async function updateGoalProgress(userId, goalId, data) {
  return updateGoal(userId, goalId, data);
}

async function completeGoal(userId, goalId) {
  const existing = await prisma.goal.findFirst({
    where: { id: goalId, userId },
  });
  if (!existing) return null;
  const goal = await prisma.goal.update({
    where: { id: goalId },
    data: {
      status: "COMPLETED",
      progressPercentage: 100,
      completedAt: new Date(),
      archived: false,
    },
    include: { goalMissions: { include: { mission: true } } },
  });
  return formatGoal(goal);
}

async function pauseGoal(userId, goalId) {
  const existing = await prisma.goal.findFirst({
    where: { id: goalId, userId },
  });
  if (!existing) return null;
  const goal = await prisma.goal.update({
    where: { id: goalId },
    data: { status: "PAUSED" },
    include: { goalMissions: { include: { mission: true } } },
  });
  return formatGoal(goal);
}

async function resumeGoal(userId, goalId) {
  const existing = await prisma.goal.findFirst({
    where: { id: goalId, userId },
  });
  if (!existing) return null;
  const goal = await prisma.goal.update({
    where: { id: goalId },
    data: { status: "ACTIVE", archived: false },
    include: { goalMissions: { include: { mission: true } } },
  });
  return formatGoal(goal);
}

async function connectMission(userId, goalId, missionId) {
  const [goal, mission] = await Promise.all([
    prisma.goal.findFirst({ where: { id: goalId, userId } }),
    prisma.mission.findFirst({ where: { id: missionId, userId } }),
  ]);
  if (!goal) return { notFound: "goal" };
  if (!mission) return { notFound: "mission" };
  await prisma.goalMission.upsert({
    where: { goalId_missionId: { goalId, missionId } },
    update: {},
    create: { goalId, missionId },
  });
  return { goal: await getGoalById(userId, goalId) };
}

async function removeMission(userId, goalId, missionId) {
  const goal = await prisma.goal.findFirst({ where: { id: goalId, userId } });
  if (!goal) return { notFound: "goal" };
  const mission = await prisma.mission.findFirst({
    where: { id: missionId, userId },
  });
  if (!mission) return { notFound: "mission" };
  await prisma.goalMission.deleteMany({ where: { goalId, missionId } });
  return { goal: await getGoalById(userId, goalId) };
}

async function getGoalSummary(userId) {
  const goals = await prisma.goal.findMany({ where: { userId } });
  const active = goals.filter(
    (goal) => goal.status === "ACTIVE" && !goal.archived,
  );
  const upcomingDeadlines = goals
    .filter(
      (goal) => goal.status === "ACTIVE" && !goal.archived && goal.targetDate,
    )
    .sort((a, b) => a.targetDate - b.targetDate)
    .slice(0, 5)
    .map(formatGoal);

  const averageProgress = goals.length
    ? Math.round(
        goals.reduce((sum, goal) => sum + goal.progressPercentage, 0) /
          goals.length,
      )
    : 0;

  return {
    totalGoals: goals.length,
    activeGoals: active.length,
    completedGoals: goals.filter((goal) => goal.status === "COMPLETED").length,
    pausedGoals: goals.filter((goal) => goal.status === "PAUSED").length,
    averageProgress,
    highPriorityGoals: goals.filter(
      (goal) =>
        goal.priority === "HIGH" && goal.status === "ACTIVE" && !goal.archived,
    ).length,
    upcomingDeadlines,
    topActiveGoal: active.sort(
      (a, b) => b.progressPercentage - a.progressPercentage,
    )[0]
      ? formatGoal(
          active.sort((a, b) => b.progressPercentage - a.progressPercentage)[0],
        )
      : null,
  };
}

module.exports = {
  archiveGoal,
  completeGoal,
  connectMission,
  createGoal,
  getGoalById,
  getGoalSummary,
  getGoalsByUserId,
  pauseGoal,
  removeMission,
  resumeGoal,
  updateGoal,
  updateGoalProgress,
};
