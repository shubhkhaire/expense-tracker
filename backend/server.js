const express = require("express");
require("dotenv").config();
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const { createTables } = require("./models/init");
const { startReminders } = require("./utils/reminder");

// Initialize express first
const app = express();

// CORS middleware
app.use(
  cors({
    origin: "*", // change later to your frontend URL
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization",
  })
);

// Body parser
app.use(express.json());

// Static uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Serve frontend (dev mode)
app.use(express.static(path.join(__dirname, "..", "frontend"), { maxAge: 0 }));

// Debug endpoint for stylesheet
app.get("/__styles", (req, res) => {
  res.setHeader("Content-Type", "text/css");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.sendFile(path.join(__dirname, "..", "frontend", "styles.css"));
});

// Debug filesystem info
app.get("/__stat", (req, res) => {
  try {
    const cssPath = path.join(__dirname, "..", "frontend", "styles.css");
    const exists = fs.existsSync(cssPath);
    const info = { exists, path: cssPath };
    if (exists) {
      const st = fs.statSync(cssPath);
      info.size = st.size;
      info.mtime = st.mtime;
      info.preview = fs.readFileSync(cssPath, "utf8").slice(0, 800);
    } else {
      info.message = "File not found";
    }
    res.json(info);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Routes
app.use("/auth", require("./routes/authRoutes"));
app.use("/categories", require("./routes/categoryRoutes"));
app.use("/expenses", require("./routes/expenseRoutes"));
app.use("/budgets", require("./routes/budgetRoutes"));
app.use("/dashboard", require("./routes/dashboardRoutes"));
app.use("/dev", require("./routes/devRoutes"));

// Root index redirect
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});

const PORT = process.env.PORT || 5000;

// Database setup
createTables();

// Start reminder cron
try {
  startReminders();
} catch (e) {
  console.warn("startReminders failed:", e.message || e);
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
