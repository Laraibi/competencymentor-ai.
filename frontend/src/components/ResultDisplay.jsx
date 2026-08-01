import Badge, { riskToLevel, statutToLevel } from "./Badge";

function Bloc1Section({ prediction, warning }) {
  if (warning) {
    return (
      <div className="card card-warning">
        <h3>Bloc 1 — Modèle ML</h3>
        <p>⚠️ Prédiction indisponible : {warning}</p>
      </div>
    );
  }
  if (!prediction) return null;

  const { C1_planification, C2_interfaces_utilisateur, profil_technique_transverse, dernier_commit_git } = prediction;
  const profileEntries = Object.entries(profil_technique_transverse || {}).filter(([key]) => key !== "fonctionnalites_bonus");
  const bonus = profil_technique_transverse?.fonctionnalites_bonus;

  return (
    <div className="card">
      <h3>Bloc 1 — Modèle ML</h3>

      <div className="metric-row">
        <span className="metric-label">{C1_planification.competence}</span>
        <Badge level={statutToLevel(C1_planification.statut_predit)}>{C1_planification.statut_predit}</Badge>
        <span className="metric-sub">confiance {Math.round(C1_planification.confiance * 100)}%</span>
      </div>

      <div className="metric-row">
        <span className="metric-label">{C2_interfaces_utilisateur.competence} — risque</span>
        <Badge level={riskToLevel(C2_interfaces_utilisateur.niveau_de_risque)}>
          {C2_interfaces_utilisateur.niveau_de_risque}
        </Badge>
        <span className="metric-sub">score {C2_interfaces_utilisateur.score_composite}</span>
      </div>

      <h4>Profil technique transverse</h4>
      <div className="badge-grid">
        {profileEntries.map(([key, crit]) => (
          <div className="metric-row" key={key}>
            <span className="metric-label">{crit.label}</span>
            <Badge level={riskToLevel(crit.niveau_de_risque)}>{crit.niveau_de_risque}</Badge>
          </div>
        ))}
        {bonus && (
          <div className="metric-row">
            <span className="metric-label">{bonus.label}</span>
            <Badge level={bonus.nb_bonus_detectes > 0 ? "good" : "neutral"}>
              {bonus.nb_bonus_detectes} / {bonus.sur}
            </Badge>
          </div>
        )}
      </div>

      {dernier_commit_git?.date && (
        <p className="muted small">Dernier commit : {new Date(dernier_commit_git.date).toLocaleString("fr-FR")}</p>
      )}
      <p className="muted small">{prediction.limite_connue}</p>
    </div>
  );
}

function Bloc2Section({ result }) {
  if (!result) return null;
  if (result.parse_error) {
    return (
      <div className="card card-warning">
        <h3>Bloc 2 — Agent LLM</h3>
        <p>⚠️ Réponse de l'agent non structurée (JSON invalide) : {result.raw}</p>
      </div>
    );
  }

  return (
    <div className="card card-highlight">
      <h3>Bloc 2 — Agent LLM</h3>
      <div className="metric-row">
        <span className="metric-label">{result.competence}</span>
        <Badge level={statutToLevel(result.statut)}>{result.statut}</Badge>
        <span className="metric-sub">{result.niveau_estime}</span>
      </div>

      <p className="feedback-apprenant">{result.feedback_apprenant}</p>

      <p className="muted small">
        <strong>Justification :</strong> {result.justification}
      </p>
    </div>
  );
}

export default function ResultDisplay({ bloc1Prediction, bloc1Warning, bloc2Result, pastEvaluationsCount }) {
  return (
    <div className="results">
      <Bloc1Section prediction={bloc1Prediction} warning={bloc1Warning} />
      {pastEvaluationsCount > 0 && (
        <p className="memory-indicator">
          🧠 {pastEvaluationsCount} évaluation{pastEvaluationsCount > 1 ? "s" : ""} précédente
          {pastEvaluationsCount > 1 ? "s" : ""} trouvée{pastEvaluationsCount > 1 ? "s" : ""} pour cet apprenant
          (mémoire de l'agent, outil get_past_evaluations)
        </p>
      )}
      <Bloc2Section result={bloc2Result} />
    </div>
  );
}
