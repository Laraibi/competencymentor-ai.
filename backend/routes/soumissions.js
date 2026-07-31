const express = require("express");
const Soumission = require("../models/Soumission");
const requireDb = require("../middleware/requireDb");

const router = express.Router();

router.post("/soumissions", requireDb, async (req, res) => {
  const { studentName, briefId, files } = req.body;
  if (!studentName || !files || typeof files !== "object") {
    return res.status(400).json({ error: "studentName et files sont requis." });
  }
  try {
    const soumission = await Soumission.create({ studentName, briefId: briefId || undefined, files });
    res.status(201).json(soumission);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
