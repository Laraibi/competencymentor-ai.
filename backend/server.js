require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { connectDB } = require("./config/db");

const evaluateRoute = require("./routes/evaluate");
const competencesRoute = require("./routes/competences");
const briefsRoute = require("./routes/briefs");
const soumissionsRoute = require("./routes/soumissions");
const evaluationsRoute = require("./routes/evaluations");

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.use("/api", evaluateRoute);
app.use("/api", soumissionsRoute);
app.use("/api", evaluationsRoute);
app.use("/api/competences", competencesRoute);
app.use("/api/briefs", briefsRoute);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Sert le build React (frontend/dist) si présent — utilisé par le conteneur Docker
// tout-en-un ; sans effet en dev (frontend servi séparément par Vite).
const FRONTEND_DIST = path.join(__dirname, "..", "frontend", "dist");
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(FRONTEND_DIST, "index.html")));
}

const PORT = process.env.PORT || 4000;

connectDB().finally(() => {
  app.listen(PORT, () => console.log(`🚀 API CompetencyMentor sur http://localhost:${PORT}`));
});
