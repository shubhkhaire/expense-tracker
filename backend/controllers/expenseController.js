const db = require("../config/db");

// Add Expense
exports.addExpense = (req, res) => {
  const { amount, category_id, note, date } = req.body;
  const user_id = req.user && req.user.id;

  if (!user_id) return res.status(401).json({ message: "Unauthorized" });
  if (!amount) return res.status(400).json({ message: "Amount is required" });

  const receipt_path = req.file ? `/uploads/${req.file.filename}` : null;

  const sql = `INSERT INTO expenses (user_id, category_id, amount, note, date, receipt_path) VALUES (?, ?, ?, ?, ?, ?)`;
  db.query(
    sql,
    [
      user_id,
      category_id || null,
      amount,
      note || null,
      date || null,
      receipt_path,
    ],
    (err, result) => {
      if (err) {
        console.error("Add expense error:", err);
        return res.status(500).json({ message: "Database error" });
      }
      res.json({ message: "Expense added", id: result.insertId });
    }
  );
};

// Edit Expense
exports.editExpense = (req, res) => {
  const { id } = req.params;
  const { amount, category_id, note, date } = req.body;
  const user_id = req.user && req.user.id;

  if (!user_id) return res.status(401).json({ message: "Unauthorized" });

  const receipt_path = req.file ? `/uploads/${req.file.filename}` : null;

  const fields = [];
  const params = [];
  if (amount !== undefined) {
    fields.push("amount = ?");
    params.push(amount);
  }
  if (category_id !== undefined) {
    fields.push("category_id = ?");
    params.push(category_id);
  }
  if (note !== undefined) {
    fields.push("note = ?");
    params.push(note);
  }
  if (date !== undefined) {
    fields.push("date = ?");
    params.push(date);
  }
  if (receipt_path) {
    fields.push("receipt_path = ?");
    params.push(receipt_path);
  }

  if (fields.length === 0)
    return res.status(400).json({ message: "No fields to update" });

  const sql = `UPDATE expenses SET ${fields.join(
    ", "
  )} WHERE id = ? AND user_id = ?`;
  params.push(id, user_id);

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("Edit expense error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Expense not found" });
    res.json({ message: "Expense updated" });
  });
};

// Delete Expense
exports.deleteExpense = (req, res) => {
  const { id } = req.params;
  const user_id = req.user && req.user.id;
  if (!user_id) return res.status(401).json({ message: "Unauthorized" });

  const sql = "DELETE FROM expenses WHERE id = ? AND user_id = ?";
  db.query(sql, [id, user_id], (err, result) => {
    if (err) {
      console.error("Delete expense error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Expense not found" });
    res.json({ message: "Expense deleted" });
  });
};

// List Expenses with filters
exports.listExpenses = (req, res) => {
  const user_id = req.user && req.user.id;
  if (!user_id) return res.status(401).json({ message: "Unauthorized" });

  const {
    startDate,
    endDate,
    search,
    category,
    page = 1,
    limit = 20,
  } = req.query;
  const offset = (page - 1) * limit;

  const where = ["user_id = ?"];
  const params = [user_id];

  if (startDate) {
    where.push("date >= ?");
    params.push(startDate);
  }
  if (endDate) {
    where.push("date <= ?");
    params.push(endDate);
  }
  if (category) {
    where.push("category_id = ?");
    params.push(category);
  }
  if (search) {
    where.push("(note LIKE ? OR amount LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const sql = `SELECT * FROM expenses ${whereSql} ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?`;
  db.query(sql, [...params, parseInt(limit), parseInt(offset)], (err, rows) => {
    if (err) {
      console.error("List expenses error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    const countSql = `SELECT COUNT(*) as total FROM expenses ${whereSql}`;
    db.query(countSql, params, (err2, countRes) => {
      if (err2) {
        console.error("Count expenses error:", err2);
        return res.status(500).json({ message: "Database error" });
      }
      const total = countRes[0].total;
      res.json({
        data: rows,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
      });
    });
  });
};
