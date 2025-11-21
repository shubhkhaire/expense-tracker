const seed = require("../utils/seed");

// Protects: only allowed when not in production or when dev key matches
function allowed(req) {
  if (process.env.NODE_ENV !== "production") return true;
  const key = process.env.DEV_SEED_KEY;
  if (!key) return false;
  const got = req.headers["x-dev-seed-key"] || req.query.key;
  return got === key;
}

exports.seed = async (req, res) => {
  if (!allowed(req))
    return res.status(403).json({ message: "Seeding not allowed" });
  try {
    const force = req.body && req.body.force;
    if (force) {
      const r = await seed.forceSeed();
      return res.json({ message: "Database force-seeded", result: r });
    }
    const r = await seed.seedIfEmpty();
    res.json({ message: "Database seeded (if empty)", result: r });
  } catch (e) {
    console.error("Dev seed error:", e);
    res
      .status(500)
      .json({ message: "Seed failed", error: e && e.message ? e.message : e });
  }
};
