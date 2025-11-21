const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const budgetController = require("../controllers/budgetController");

router.post("/", auth, budgetController.createBudget);
router.put("/:id", auth, budgetController.updateBudget);
router.get("/", auth, budgetController.listBudgets);
router.delete("/:id", auth, budgetController.deleteBudget);

module.exports = router;
