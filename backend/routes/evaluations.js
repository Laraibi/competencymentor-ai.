const express = require("express");
const Evaluation = require("../models/Evaluation");
const requireDb = require("../middleware/requireDb");
const { getEvaluationHistory } = require("../services/evaluationHistory");

const router = express.Router();

// Toutes les évaluations (plus récentes en premier), avec le nom de l'apprenant
// résolu via la soumission liée — alimente le tableau de l'onglet Historique.
router.get("/evaluations", requireDb, async (req, res) => {
  const evaluations = await Evaluation.find()
    .sort({ dateEvaluation: -1 })
    .limit(500)
    .populate("soumissionId", "studentName");
  res.json(
    evaluations.map((ev) => ({
      ...ev.toObject(),
      studentName: ev.soumissionId?.studentName || null,
    }))
  );
});

router.get("/evaluations/:studentName", requireDb, async (req, res) => {
  const evaluations = await getEvaluationHistory(req.params.studentName);
  res.json(evaluations);
});

module.exports = router;
