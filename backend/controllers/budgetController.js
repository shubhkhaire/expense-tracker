const db = require("../config/db");

// Create monthly budget
exports.createBudget = (req, res) => {
  const user_id = req.user && req.user.id;
  const { month, category_id, allocated_amount } = req.body; // month = 'YYYY-MM'
  if (!user_id) return res.status(401).json({ message: "Unauthorized" });
  if (!month || !allocated_amount)
    return res
      .status(400)
      .json({ message: "month and allocated_amount required" });

  const sql =
    "INSERT INTO budgets (user_id, month, category_id, allocated_amount) VALUES (?, ?, ?, ?)";
  db.query(
    sql,
    [user_id, month, category_id || null, allocated_amount],
    (err, result) => {
      if (err) {
        console.error("Create budget error:", err);
        return res.status(500).json({ message: "Database error" });
      }
      res.json({ message: "Budget created", id: result.insertId });
    }
  );
};

// Update budget
exports.updateBudget = (req, res) => {
  const user_id = req.user && req.user.id;
  const { id } = req.params;
  const { allocated_amount } = req.body;
  if (!user_id) return res.status(401).json({ message: "Unauthorized" });
  if (allocated_amount === undefined)
    return res.status(400).json({ message: "allocated_amount required" });

  const sql =
    "UPDATE budgets SET allocated_amount = ? WHERE id = ? AND user_id = ?";
  db.query(sql, [allocated_amount, id, user_id], (err, result) => {
    if (err) {
      console.error("Update budget error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Budget not found" });
    res.json({ message: "Budget updated" });
  });
};

// Get budgets for user (with usage tracked)
exports.listBudgets = (req, res) => {
  const user_id = req.user && req.user.id;
  if (!user_id) return res.status(401).json({ message: "Unauthorized" });

  const sql = "SELECT * FROM budgets WHERE user_id = ? ORDER BY month DESC";
  db.query(sql, [user_id], (err, rows) => {
    if (err) return res.status(500).json({ message: "Database error" });

    if (!rows.length) return res.json({ data: [] });

    // For each budget, compute usage
    const promises = rows.map(
      (b) =>
        new Promise((resolve, reject) => {
          const monthStart = `${b.month}-01`;
          const [year, mon] = b.month.split("-");
          const monthEnd = new Date(year, parseInt(mon), 0)
            .toISOString()
            .slice(0, 10); // approximate

          const sql2 =
            "SELECT IFNULL(SUM(amount),0) as spent FROM expenses WHERE user_id = ? AND date >= ? AND date <= ?";
          const start = `${b.month}-01`;
          const end = `${b.month}-31`;
          db.query(sql2, [user_id, start, end], (err2, res2) => {
            if (err2) return resolve({ ...b, spent: 0 });
            resolve({ ...b, spent: res2[0].spent });
          });
        })
    );

    Promise.all(promises)
      .then((results) => res.json({ data: results }))
      .catch((e) => res.status(500).json({ message: "Error computing usage" }));
  });
};

// Delete budget
exports.deleteBudget = (req, res) => {
  const user_id = req.user && req.user.id;
  const { id } = req.params;
  if (!user_id) return res.status(401).json({ message: "Unauthorized" });

  const sql = "DELETE FROM budgets WHERE id = ? AND user_id = ?";
  db.query(sql, [id, user_id], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Budget not found" });
    res.json({ message: "Budget deleted" });
  });
};
