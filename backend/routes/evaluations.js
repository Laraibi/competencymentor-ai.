const express = require("express");
const Evaluation = require("../models/Evaluation");
const Soumission = require("../models/Soumission");
const requireDb = require("../middleware/requireDb");

const router = express.Router();

router.get("/evaluations/:studentName", requireDb, async (req, res) => {
  const soumissions = await Soumission.find({ studentName: req.params.studentName }).select("_id");
  const soumissionIds = soumissions.map((s) => s._id);
  const evaluations = await Evaluation.find({ soumissionId: { $in: soumissionIds } }).sort({ dateEvaluation: -1 });
  res.json(evaluations);
});

module.exports = router;
