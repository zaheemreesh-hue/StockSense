const express = require("express");
const router = express.Router();
const { getDashboard, getInsights, getAlerts } = require("../controllers/analyticsController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);
router.get("/dashboard", getDashboard);
router.get("/insights", getInsights);
router.get("/alerts", getAlerts);

module.exports = router;
