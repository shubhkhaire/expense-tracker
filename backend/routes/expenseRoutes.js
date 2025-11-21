const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const expenseController = require("../controllers/expenseController");
const auth = require("../middleware/authMiddleware");

// multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, "..", "uploads")),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});
const upload = multer({ storage });

router.post("/", auth, upload.single("receipt"), expenseController.addExpense);
router.put(
  "/:id",
  auth,
  upload.single("receipt"),
  expenseController.editExpense
);
router.delete("/:id", auth, expenseController.deleteExpense);
router.get("/", auth, expenseController.listExpenses);

module.exports = router;
