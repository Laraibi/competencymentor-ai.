const express = require("express");
const OpenAI = require("openai");
const { isDbConnected } = require("../config/db");
const Competence = require("../models/Competence");
const Brief = require("../models/Brief");
const Soumission = require("../models/Soumission");
const Evaluation = require("../models/Evaluation");
const { runBloc1Prediction } = require("../services/bloc1");
const { evaluateCompetence } = require("../../bloc2_agent/agent");

const router = express.Router();

router.post("/evaluate", async (req, res) => {
  const { studentName, files, competenceCode, competenceDescription, briefId, briefCriteria } = req.body;

  if (!studentName || !files || typeof files !== "object" || Object.keys(files).length === 0) {
    return res.status(400).json({ error: "studentName et files (objet non vide) sont requis." });
  }

  let resolvedCompetenceDescription = competenceDescription;
  let resolvedCompetenceCode = competenceCode || null;
  if (competenceCode && isDbConnected()) {
    const competence = await Competence.findOne({ code: competenceCode }).catch(() => null);
    if (competence) {
      resolvedCompetenceDescription = `${competence.code}. ${competence.libelle} — ${competence.description}`;
    }
  }
  if (!resolvedCompetenceDescription) {
    return res.status(400).json({ error: "competenceDescription requis (ou competenceCode existant en base)." });
  }

  let resolvedBriefCriteria = briefCriteria;
  if (briefId && isDbConnected()) {
    const brief = await Brief.findById(briefId).catch(() => null);
    if (brief) {
      resolvedBriefCriteria = brief.criteresPerformance.join("\n- ");
    }
  }
  if (!resolvedBriefCriteria) {
    return res.status(400).json({ error: "briefCriteria requis (ou briefId existant en base)." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "OPENAI_API_KEY manquante côté serveur (.env)." });
  }

  const { prediction: bloc1Prediction, error: bloc1Error } = await runBloc1Prediction(files);
  if (bloc1Error) {
    console.warn("⚠️  Bloc 1 indisponible pour cette évaluation :", bloc1Error);
  }

  let bloc2Result;
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    bloc2Result = await evaluateCompetence(client, {
      studentName,
      files,
      competenceDescription: resolvedCompetenceDescription,
      briefCriteria: resolvedBriefCriteria,
      bloc1Prediction,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    });
  } catch (err) {
    return res.status(502).json({ error: `Appel à l'agent Bloc 2 échoué : ${err.message}`, bloc1Prediction });
  }

  // Persistance best-effort : ne doit jamais empêcher la démo de répondre.
  if (isDbConnected()) {
    try {
      const soumission = await Soumission.create({
        studentName,
        briefId: briefId || undefined,
        files,
      });
      await Evaluation.create({
        soumissionId: soumission._id,
        competenceCode: resolvedCompetenceCode || "COLD_START",
        bloc1Prediction,
        bloc2Result,
      });
    } catch (err) {
      console.warn("⚠️  Sauvegarde en base échouée (réponse renvoyée quand même) :", err.message);
    }
  }

  res.json({
    bloc1Prediction,
    bloc1Warning: bloc1Error || undefined,
    bloc2Result,
  });
});

module.exports = router;
