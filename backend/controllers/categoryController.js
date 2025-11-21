const db = require("../config/db");

// CREATE CATEGORY
exports.createCategory = (req, res) => {
  const userId = req.user.id;
  const { name, icon, color } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({ message: "Category name is required" });
  }

  const sql =
    "INSERT INTO categories (user_id, name, icon, color) VALUES (?, ?, ?, ?)";
  db.query(
    sql,
    [userId, name.trim(), icon || null, color || null],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ message: "Error creating category" });
      }

      res.json({
        id: result.insertId,
        user_id: userId,
        name: name.trim(),
        icon: icon || null,
        color: color || null,
      });
    }
  );
};

// LIST ALL CATEGORIES
exports.listCategories = (req, res) => {
  const userId = req.user.id;

  const sql = "SELECT * FROM categories WHERE user_id = ? ORDER BY name ASC";
  db.query(sql, [userId], (err, rows) => {
    if (err)
      return res.status(500).json({ message: "Error fetching categories" });

    res.json(rows);
  });
};

// GET ONE CATEGORY
exports.getCategory = (req, res) => {
  const userId = req.user.id;
  const categoryId = req.params.id;

  const sql = "SELECT * FROM categories WHERE id = ? AND user_id = ?";
  db.query(sql, [categoryId, userId], (err, rows) => {
    if (err)
      return res.status(500).json({ message: "Error fetching category" });

    if (rows.length === 0)
      return res.status(404).json({ message: "Category not found" });

    res.json(rows[0]);
  });
};

// UPDATE CATEGORY
exports.updateCategory = (req, res) => {
  const userId = req.user.id;
  const categoryId = req.params.id;
  const { name, icon, color } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({ message: "Name required" });
  }

  const sql =
    "UPDATE categories SET name=?, icon=?, color=? WHERE id=? AND user_id=?";
  db.query(
    sql,
    [name.trim(), icon || null, color || null, categoryId, userId],
    (err, result) => {
      if (err)
        return res.status(500).json({ message: "Error updating category" });

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Category not found" });
      }

      res.json({ message: "Updated successfully" });
    }
  );
};

// DELETE CATEGORY
exports.deleteCategory = (req, res) => {
  const userId = req.user.id;
  const categoryId = req.params.id;

  const sql = "DELETE FROM categories WHERE id=? AND user_id=?";
  db.query(sql, [categoryId, userId], (err, result) => {
    if (err)
      return res.status(500).json({ message: "Error deleting category" });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ message: "Category deleted" });
  });
};
