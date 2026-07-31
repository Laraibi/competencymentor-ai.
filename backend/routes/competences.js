const express = require("express");
const Competence = require("../models/Competence");
const requireDb = require("../middleware/requireDb");

const router = express.Router();
router.use(requireDb);

router.get("/", async (req, res) => {
  const competences = await Competence.find().sort({ code: 1 });
  res.json(competences);
});

router.post("/", async (req, res) => {
  try {
    const competence = await Competence.create(req.body);
    res.status(201).json(competence);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const competence = await Competence.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!competence) return res.status(404).json({ error: "Compétence introuvable" });
    res.json(competence);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  const competence = await Competence.findByIdAndDelete(req.params.id);
  if (!competence) return res.status(404).json({ error: "Compétence introuvable" });
  res.status(204).send();
});

module.exports = router;
