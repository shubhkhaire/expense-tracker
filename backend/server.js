const express = require("express");
const cors = require("cors");
require("dotenv").config();

const path = require("path");
const fs = require("fs");
const { createTables } = require("./models/init");
const { startReminders } = require("./utils/reminder");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // for receipts

// Serve frontend static files (HTML/CSS/JS) with no caching (dev)
app.use(express.static(path.join(__dirname, "..", "frontend"), { maxAge: 0 }));

// Debug endpoint: return current styles.css contents (helps verify served CSS)
app.get("/__styles", (req, res) => {
  res.setHeader("Content-Type", "text/css");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.sendFile(path.join(__dirname, "..", "frontend", "styles.css"));
});

// Debug filesystem info for styles.css — helps diagnose why CSS may not load
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
      info.message = "File not found on disk";
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
// Dev-only seeding/reset route (protected by NODE_ENV or DEV_SEED_KEY)
app.use("/dev", require("./routes/devRoutes"));

const PORT = process.env.PORT || 5000;

// Ensure tables exist
createTables();

// Start reminder cron (best-effort)
try {
  startReminders();
} catch (e) {
  console.warn("startReminders failed:", e && e.message ? e.message : e);
}

// Ensure root serves the frontend index explicitly
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
