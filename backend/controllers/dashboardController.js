const db = require("../config/db");

// Monthly totals for a given year
exports.monthlyTotals = (req, res) => {
  const user_id = req.user && req.user.id;
  if (!user_id) return res.status(401).json({ message: "Unauthorized" });

  const year = req.query.year || new Date().getFullYear();
  const sql = `SELECT MONTH(date) as month, IFNULL(SUM(amount),0) as total FROM expenses WHERE user_id = ? AND YEAR(date) = ? GROUP BY MONTH(date)`;
  db.query(sql, [user_id, year], (err, rows) => {
    if (err) return res.status(500).json({ message: "Database error" });
    const totals = Array.from({ length: 12 }).map((_, i) => {
      const found = rows.find((r) => r.month === i + 1);
      return found ? Number(found.total) : 0;
    });
    res.json({ data: totals });
  });
};

// Category-wise spending between dates
exports.categorySpending = (req, res) => {
  const user_id = req.user && req.user.id;
  if (!user_id) return res.status(401).json({ message: "Unauthorized" });

  const { startDate, endDate } = req.query;
  const start = startDate || "1970-01-01";
  const end = endDate || "9999-12-31";

  const sql = `SELECT c.name as category, IFNULL(SUM(e.amount),0) as total FROM categories c LEFT JOIN expenses e ON c.id = e.category_id AND e.user_id = ? AND e.date BETWEEN ? AND ? WHERE c.user_id = ? GROUP BY c.id ORDER BY total DESC`;
  db.query(sql, [user_id, start, end, user_id], (err, rows) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json({ data: rows });
  });
};

// Chart.js-ready data endpoint
exports.chartData = (req, res) => {
  const user_id = req.user && req.user.id;
  if (!user_id) return res.status(401).json({ message: "Unauthorized" });

  const year = req.query.year || new Date().getFullYear();
  const sqlMonthly = `SELECT MONTH(date) as month, IFNULL(SUM(amount),0) as total FROM expenses WHERE user_id = ? AND YEAR(date) = ? GROUP BY MONTH(date)`;
  db.query(sqlMonthly, [user_id, year], (err, rows) => {
    if (err) return res.status(500).json({ message: "Database error" });
    const monthly = Array.from({ length: 12 }).map((_, i) => {
      const found = rows.find((r) => r.month === i + 1);
      return found ? Number(found.total) : 0;
    });

    const sqlCat = `SELECT c.name as category, IFNULL(SUM(e.amount),0) as total FROM categories c LEFT JOIN expenses e ON c.id = e.category_id AND e.user_id = ? AND YEAR(e.date) = ? WHERE c.user_id = ? GROUP BY c.id ORDER BY total DESC`;
    db.query(sqlCat, [user_id, year, user_id], (err2, rows2) => {
      if (err2) return res.status(500).json({ message: "Database error" });
      const categories = rows2.map((r) => r.category);
      const catTotals = rows2.map((r) => Number(r.total));

      res.json({ data: { monthly, categories, catTotals } });
    });
  });
};
