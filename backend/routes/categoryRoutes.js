const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

const {
  createCategory,
  listCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

// All category routes require login
router.use(auth);

router.post("/", createCategory);
router.get("/", listCategories);
router.get("/:id", getCategory);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

module.exports = router;
