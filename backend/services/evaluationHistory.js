const Soumission = require("../models/Soumission");
const Evaluation = require("../models/Evaluation");

/**
 * Historique MongoDB des évaluations d'un apprenant (plus récentes en premier).
 * Source de vérité unique, utilisée à la fois par la route GET
 * /api/evaluations/:studentName (frontend) et par l'injection de mémoire
 * de l'agent (Bloc 2) dans routes/evaluate.js.
 */
async function getEvaluationHistory(studentName) {
  const soumissions = await Soumission.find({ studentName }).select("_id");
  const soumissionIds = soumissions.map((s) => s._id);
  return Evaluation.find({ soumissionId: { $in: soumissionIds } }).sort({ dateEvaluation: -1 });
}

/**
 * Forme aplatie et lisible utilisée par l'outil get_past_evaluations de
 * l'agent : le LLM reçoit un résumé plutôt que le document Mongo brut.
 */
function toAgentMemoryShape(evaluations) {
  return evaluations.map((ev) => ({
    competence: ev.bloc2Result?.competence || ev.competenceCode,
    statut: ev.bloc2Result?.statut,
    niveau_estime: ev.bloc2Result?.niveau_estime,
    feedback_apprenant: ev.bloc2Result?.feedback_apprenant,
    date: ev.dateEvaluation,
  }));
}

module.exports = { getEvaluationHistory, toAgentMemoryShape };
