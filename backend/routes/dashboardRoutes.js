const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const dashboardController = require("../controllers/dashboardController");

router.get("/monthly-totals", auth, dashboardController.monthlyTotals);
router.get("/category-spending", auth, dashboardController.categorySpending);
router.get("/chart-data", auth, dashboardController.chartData);

module.exports = router;
