"use strict";

const {
  getAchievementsForUser,
  getUnlockedAchievements,
  getLockedAchievements,
  getAchievementSummary,
  getAchievementById,
  recalculateAchievements,
} = require("../services/achievementService");
const {
  scheduleIdentityRecalculation,
} = require("../services/identityService");

function handleError(error, res, fallbackMessage) {
  if (error.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  console.error(fallbackMessage, error);
  return res.status(500).json({ message: fallbackMessage });
}

async function listAchievements(req, res) {
  try {
    const achievements = await getAchievementsForUser(req.user.id);
    return res.json({ achievements });
  } catch (error) {
    return handleError(error, res, "Unable to load achievements");
  }
}

async function listUnlocked(req, res) {
  try {
    const achievements = await getUnlockedAchievements(req.user.id);
    return res.json({ achievements });
  } catch (error) {
    return handleError(error, res, "Unable to load unlocked achievements");
  }
}

async function listLocked(req, res) {
  try {
    const achievements = await getLockedAchievements(req.user.id);
    return res.json({ achievements });
  } catch (error) {
    return handleError(error, res, "Unable to load locked achievements");
  }
}

async function achievementSummary(req, res) {
  try {
    const summary = await getAchievementSummary(req.user.id);
    return res.json({ summary });
  } catch (error) {
    return handleError(error, res, "Unable to load achievement summary");
  }
}

async function achievementDetail(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res
        .status(400)
        .json({ message: "Achievement ID must be a positive integer" });
    }
    const achievement = await getAchievementById(req.user.id, id);
    if (!achievement)
      return res.status(404).json({ message: "Achievement not found" });
    return res.json({ achievement });
  } catch (error) {
    return handleError(error, res, "Unable to load achievement");
  }
}

async function recalculate(req, res) {
  try {
    const result = await recalculateAchievements(req.user.id);
    res.json({
      message: "Achievements recalculated",
      count: result.allChecked,
      newlyUnlocked: result.newlyUnlocked.length,
    });
    scheduleIdentityRecalculation(req.user.id, "achievement recalculation");
    return undefined;
  } catch (error) {
    return handleError(error, res, "Unable to recalculate achievements");
  }
}

module.exports = {
  listAchievements,
  listUnlocked,
  listLocked,
  achievementSummary,
  achievementDetail,
  recalculate,
};
