const cron = require("node-cron");
const nodemailer = require("nodemailer");
const db = require("../config/db");

function startReminders() {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Daily expense reminder at 08:00
  cron.schedule(
    "0 8 * * *",
    () => {
      console.log("Running daily expense reminder");
      // For demo: send one email to each user with today's expenses count
      const sqlUsers = "SELECT id, email, name FROM users";
      db.query(sqlUsers, (err, users) => {
        if (err) return console.error("Reminder: get users error", err);
        users.forEach((u) => {
          const today = new Date().toISOString().slice(0, 10);
          const sql =
            "SELECT COUNT(*) as cnt, IFNULL(SUM(amount),0) as total FROM expenses WHERE user_id = ? AND date = ?";
          db.query(sql, [u.id, today], (err2, res2) => {
            if (err2) return console.error("Reminder: query error", err2);
            const { cnt, total } = res2[0];
            const mailOptions = {
              from: process.env.EMAIL_USER,
              to: u.email,
              subject: "Daily expenses summary",
              text: `Hello ${
                u.name || ""
              }, you have ${cnt} expenses today totaling ${total}`,
            };
            transporter.sendMail(mailOptions, (err3, info) => {
              if (err3) return console.error("Reminder: mail error", err3);
              console.log("Reminder sent to", u.email);
            });
          });
        });
      });
    },
    { timezone: "UTC" }
  );

  // Budget warning job: run every day at 09:00 UTC
  cron.schedule(
    "0 9 * * *",
    () => {
      console.log("Running budget warnings");
      const sql = `SELECT b.id, b.user_id, b.month, b.amount, u.email, u.name FROM budgets b JOIN users u ON b.user_id = u.id`;
      db.query(sql, (err, rows) => {
        if (err) return console.error("Budget warning: error", err);
        rows.forEach((b) => {
          const start = `${b.month}-01`;
          const end = `${b.month}-31`;
          const sql2 =
            "SELECT IFNULL(SUM(amount),0) as spent FROM expenses WHERE user_id = ? AND date BETWEEN ? AND ?";
          db.query(sql2, [b.user_id, start, end], (err2, res2) => {
            if (err2) return console.error("Budget warning query error", err2);
            const spent = Number(res2[0].spent || 0);
            const pct = (spent / Number(b.amount || 1)) * 100;
            if (pct >= 90) {
              const mailOptions = {
                from: process.env.EMAIL_USER,
                to: b.email,
                subject: `Budget warning for ${b.month}`,
                text: `Hi ${b.name || ""}, you have used ${spent} of ${
                  b.amount
                } (${Math.round(pct)}%) for ${b.month}`,
              };
              transporter.sendMail(mailOptions, (err3) => {
                if (err3) return console.error("Budget mail error", err3);
                console.log("Budget warning sent to", b.email);
              });
            }
          });
        });
      });
    },
    { timezone: "UTC" }
  );
}

module.exports = { startReminders };
