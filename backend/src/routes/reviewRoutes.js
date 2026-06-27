const express = require("express");
const {
  currentMonthlyReview,
  generateMonthlyReview,
  monthReview,
  monthlyHistory,
} = require("../controllers/monthlyReviewController");
const {
  currentWeeklyReview,
  generateWeeklyReview,
  weekReview,
  weeklyHistory,
} = require("../controllers/weeklyReviewController");
const requireAuth = require("../middleware/authMiddleware");
const {
  validateMonthlyReviewParams,
  validateMonthlyReviewQuery,
} = require("../middleware/monthlyReviewValidation");
const {
  validateWeekStart,
  validateWeeklyReviewQuery,
} = require("../middleware/weeklyReviewValidation");

const router = express.Router();

router.use(requireAuth);

router.get("/monthly", validateMonthlyReviewQuery, currentMonthlyReview);
router.get("/monthly/history", monthlyHistory);
router.post(
  "/monthly/generate",
  validateMonthlyReviewQuery,
  generateMonthlyReview,
);
router.get("/monthly/:year/:month", validateMonthlyReviewParams, monthReview);

router.get("/weekly", validateWeeklyReviewQuery, currentWeeklyReview);
router.get("/weekly/history", weeklyHistory);
router.get("/weekly/:weekStart", validateWeekStart, weekReview);
router.post(
  "/weekly/generate",
  validateWeeklyReviewQuery,
  generateWeeklyReview,
);

module.exports = router;
