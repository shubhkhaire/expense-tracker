const db = require("../config/db");
const bcrypt = require("bcryptjs");

function createTables() {
  const users = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100),
      email VARCHAR(150) UNIQUE,
      password VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=INNODB;
  `;

  const categories = `
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      name VARCHAR(100),
      icon VARCHAR(64),
      color VARCHAR(16),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=INNODB;
  `;

  const expenses = `
    CREATE TABLE IF NOT EXISTS expenses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      category_id INT,
      amount DECIMAL(10,2) NOT NULL,
      note TEXT,
      date DATE,
      receipt_path VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    ) ENGINE=INNODB;
  `;

  const budgets = `
    CREATE TABLE IF NOT EXISTS budgets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      month VARCHAR(7), -- YYYY-MM
      category_id INT,
      allocated_amount DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=INNODB;
  `;

  const notifications = `
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      title VARCHAR(255),
      body TEXT,
      read_flag TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=INNODB;
  `;

  db.query(users, (err) => {
    if (err) console.error("Create users table error:", err);
  });
  db.query(categories, (err) => {
    if (err) console.error("Create categories table error:", err);
  });
  db.query(expenses, (err) => {
    if (err) console.error("Create expenses table error:", err);
  });
  db.query(budgets, (err) => {
    if (err) console.error("Create budgets table error:", err);
  });
  db.query(notifications, (err) => {
    if (err) console.error("Create notifications table error:", err);
  });
}

module.exports = { createTables };

// Call seed utility after creating tables (non-destructive)
try {
  const seed = require("../utils/seed");
  // allow a small delay for table creation statements to finish
  setTimeout(() => {
    seed.seedIfEmpty().catch((e) => console.warn("seedIfEmpty failed:", e));
  }, 600);
} catch (e) {
  console.warn("Seed utility not available:", e && e.message ? e.message : e);
}
