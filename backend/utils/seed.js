const db = require("../config/db");
const bcrypt = require("bcryptjs");

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function ensureUser() {
  const rows = await runQuery("SELECT COUNT(*) as c FROM users");
  const count = rows && rows[0] && rows[0].c ? rows[0].c : 0;
  if (count === 0) {
    const pw = bcrypt.hashSync("password", 10);
    const res = await runQuery(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      ["Demo User", "demo@example.com", pw]
    );
    return res.insertId;
  }

  const found = await runQuery("SELECT id FROM users WHERE email = ? LIMIT 1", [
    "demo@example.com",
  ]);
  if (found && found.length) return found[0].id;

  const any = await runQuery("SELECT id FROM users LIMIT 1");
  return any && any.length ? any[0].id : null;
}

async function seedIfEmpty() {
  try {
    const userId = await ensureUser();
    if (!userId) return;

    // categories
    const catCount = (
      await runQuery("SELECT COUNT(*) as c FROM categories WHERE user_id = ?", [
        userId,
      ])
    )[0].c;
    if (!catCount) {
      const cats = [
        [userId, "Groceries", "shopping-cart", "#34d399"],
        [userId, "Transport", "car", "#60a5fa"],
        [userId, "Bills", "bill", "#f97316"],
        [userId, "Eating Out", "utensils", "#a78bfa"],
      ];
      await runQuery(
        "INSERT INTO categories (user_id, name, icon, color) VALUES ?",
        [cats]
      );
    }

    // expenses
    const expCount = (
      await runQuery("SELECT COUNT(*) as c FROM expenses WHERE user_id = ?", [
        userId,
      ])
    )[0].c;
    if (!expCount) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const sampleDate = `${yyyy}-${mm}-15`;
      const exps = [
        [
          userId,
          null,
          12.5,
          "Coffee and snack",
          sampleDate,
          "/uploads/expense-sample-1.svg",
        ],
        [userId, null, 45.0, "Grocery run", sampleDate, null],
        [
          userId,
          null,
          120.0,
          "Electricity bill",
          sampleDate,
          "/uploads/expense-sample-2.svg",
        ],
      ];
      await runQuery(
        "INSERT INTO expenses (user_id, category_id, amount, note, date, receipt_path) VALUES ?",
        [exps]
      );
    }

    // budgets
    const budCount = (
      await runQuery("SELECT COUNT(*) as c FROM budgets WHERE user_id = ?", [
        userId,
      ])
    )[0].c;
    if (!budCount) {
      const thisMonth = new Date();
      const ym = `${thisMonth.getFullYear()}-${String(
        thisMonth.getMonth() + 1
      ).padStart(2, "0")}`;
      const budgets = [[userId, ym, null, 500.0]];
      await runQuery(
        "INSERT INTO budgets (user_id, month, category_id, allocated_amount) VALUES ?",
        [budgets]
      );
    }

    // notifications
    const noteCount = (
      await runQuery(
        "SELECT COUNT(*) as c FROM notifications WHERE user_id = ?",
        [userId]
      )
    )[0].c;
    if (!noteCount) {
      const notes = [
        [userId, "Welcome", "This is sample data to help you get started.", 0],
      ];
      await runQuery(
        "INSERT INTO notifications (user_id, title, body, read_flag) VALUES ?",
        [notes]
      );
    }

    return { seeded: true };
  } catch (e) {
    console.warn("seedIfEmpty error:", e);
    throw e;
  }
}

async function forceSeed() {
  try {
    const userId = await ensureUser();
    if (!userId) return { ok: false };

    // Delete existing rows for this user
    await runQuery("DELETE FROM expenses WHERE user_id = ?", [userId]);
    await runQuery("DELETE FROM budgets WHERE user_id = ?", [userId]);
    await runQuery("DELETE FROM categories WHERE user_id = ?", [userId]);
    await runQuery("DELETE FROM notifications WHERE user_id = ?", [userId]);

    // Re-seed
    await seedIfEmpty();
    return { reset: true };
  } catch (e) {
    console.warn("forceSeed error:", e);
    throw e;
  }
}

module.exports = { seedIfEmpty, forceSeed };
