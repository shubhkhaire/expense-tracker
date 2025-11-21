const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// REGISTER
exports.registerUser = (req, res) => {
  const { name, email, password } = req.body;

  const hashedPassword = bcrypt.hashSync(password, 10);

  const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
  db.query(sql, [name, email, hashedPassword], (err, result) => {
    if (err) {
      console.log(err);
      return res
        .status(400)
        .json({ message: "Email already exists or invalid data" });
    }
    return res.json({ message: "User registered successfully" });
  });
};

// LOGIN
exports.loginUser = (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], (err, data) => {
    if (err || data.length === 0) {
      return res.status(400).json({ message: "Invalid email" });
    }

    const user = data[0];

    if (typeof password !== "string") {
      return res.status(400).json({ message: "Password must be a string" });
    }

    const passwordMatch = bcrypt.compareSync(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Ensure JWT secret is set (fail gracefully for dev)
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not set in environment");
      return res
        .status(500)
        .json({ message: "Server misconfiguration: JWT secret not set" });
    }

    let token;
    try {
      token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );
    } catch (e) {
      console.error("Error signing JWT:", e && e.message ? e.message : e);
      return res.status(500).json({ message: "Failed to create auth token" });
    }

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  });
};
