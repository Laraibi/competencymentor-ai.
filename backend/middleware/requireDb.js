const { isDbConnected } = require("../config/db");

function requireDb(req, res, next) {
  if (!isDbConnected()) {
    return res.status(503).json({ error: "MongoDB non connecté (MONGODB_URI absente/invalide dans .env)." });
  }
  next();
}

module.exports = requireDb;
