const express = require("express");
const fs = require("fs");
const OpenAI = require("openai");
const { isDbConnected } = require("../config/db");
const Competence = require("../models/Competence");
const Brief = require("../models/Brief");
const Soumission = require("../models/Soumission");
const Evaluation = require("../models/Evaluation");
const { runBloc1Prediction, runBloc1PredictionOnDir } = require("../services/bloc1");
const { cloneRepo, loadFilesFromDir } = require("../services/repoClone");
const { getEvaluationHistory, toAgentMemoryShape } = require("../services/evaluationHistory");
const { evaluateCompetence } = require("../../bloc2_agent/agent");

const router = express.Router();

router.post("/evaluate", async (req, res) => {
  const { studentName, files: providedFiles, repoUrl, competenceCode, competenceDescription, briefId, briefCriteria } = req.body;

  if (!studentName) {
    return res.status(400).json({ error: "studentName est requis." });
  }
  if (!providedFiles && !repoUrl) {
    return res.status(400).json({ error: "files (objet non vide) ou repoUrl est requis." });
  }
  if (providedFiles && (typeof providedFiles !== "object" || Object.keys(providedFiles).length === 0)) {
    return res.status(400).json({ error: "files doit être un objet non vide." });
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

  // Si repoUrl est fourni (sans files), on clone le repo dans un dossier
  // temporaire dédié et on l'utilise directement comme --repo-dir pour le
  // Bloc 1 (pas de double écriture). Sinon, comportement existant : files
  // est déjà fourni, runBloc1Prediction gère son propre dossier temporaire.
  let files = providedFiles;
  let clonedDir = null;

  if (repoUrl) {
    try {
      clonedDir = await cloneRepo(repoUrl);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
    files = loadFilesFromDir(clonedDir);
    if (Object.keys(files).length === 0) {
      fs.rm(clonedDir, { recursive: true, force: true }, () => {});
      return res.status(400).json({ error: "Aucun fichier .html/.css/.js trouvé dans le repo cloné." });
    }
  }

  try {
    const { prediction: bloc1Prediction, error: bloc1Error } = clonedDir
      ? await runBloc1PredictionOnDir(clonedDir)
      : await runBloc1Prediction(files);
    if (bloc1Error) {
      console.warn("⚠️  Bloc 1 indisponible pour cette évaluation :", bloc1Error);
    }

    let bloc2Result;
    try {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      // Quand MongoDB est connectée, l'agent doit voir le même historique que
      // celui affiché dans l'app (une seule source de vérité) : on lui injecte
      // une mémoire branchée sur la base plutôt que le fichier JSON local par
      // défaut. addEvaluation est neutralisé ici pour ne pas doublonner
      // l'écriture — la persistance réelle est faite juste après (Evaluation.create).
      const memoryOverrides = isDbConnected()
        ? {
            getPastEvaluations: async (name) => toAgentMemoryShape(await getEvaluationHistory(name)),
            addEvaluation: async () => {},
          }
        : {};
      bloc2Result = await evaluateCompetence(client, {
        studentName,
        files,
        competenceDescription: resolvedCompetenceDescription,
        briefCriteria: resolvedBriefCriteria,
        bloc1Prediction,
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        ...memoryOverrides,
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
  } finally {
    if (clonedDir) fs.rm(clonedDir, { recursive: true, force: true }, () => {});
  }
});

module.exports = router;
