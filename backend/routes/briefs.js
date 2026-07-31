const express = require("express");
const Brief = require("../models/Brief");
const requireDb = require("../middleware/requireDb");

const router = express.Router();
router.use(requireDb);

router.get("/", async (req, res) => {
  const briefs = await Brief.find().sort({ titre: 1 });
  res.json(briefs);
});

router.post("/", async (req, res) => {
  try {
    const brief = await Brief.create(req.body);
    res.status(201).json(brief);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const brief = await Brief.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!brief) return res.status(404).json({ error: "Brief introuvable" });
    res.json(brief);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  const brief = await Brief.findByIdAndDelete(req.params.id);
  if (!brief) return res.status(404).json({ error: "Brief introuvable" });
  res.status(204).send();
});

module.exports = router;
