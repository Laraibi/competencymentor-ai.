import { useState } from "react";
import Badge, { statutToLevel } from "./Badge";

const FEEDBACK_TRUNCATE_LENGTH = 180;

export default function EvaluationCard({ evaluation }) {
  const [expanded, setExpanded] = useState(false);
  const { competenceCode, bloc1Prediction, bloc2Result, formateurValidation, dateEvaluation } = evaluation;

  const competenceLabel = bloc2Result?.competence || competenceCode;
  const statut = bloc2Result?.statut;
  const niveau = bloc2Result?.niveau_estime;
  const feedback = bloc2Result?.feedback_apprenant;
  const isTruncated = feedback && feedback.length > FEEDBACK_TRUNCATE_LENGTH && !expanded;
  const feedbackShown = isTruncated ? `${feedback.slice(0, FEEDBACK_TRUNCATE_LENGTH).trim()}…` : feedback;

  return (
    <div className="card history-card">
      <div className="metric-row">
        <span className="metric-label">{competenceLabel}</span>
        {statut && <Badge level={statutToLevel(statut)}>{statut}</Badge>}
        {niveau && <span className="metric-sub">{niveau}</span>}
      </div>

      <p className="muted small">
        {dateEvaluation ? new Date(dateEvaluation).toLocaleString("fr-FR") : "Date inconnue"}
        {!bloc1Prediction && " · cold start (pas de prédiction Bloc 1)"}
      </p>

      {formateurValidation && formateurValidation.valide !== null && formateurValidation.valide !== undefined && (
        <Badge level={formateurValidation.valide ? "good" : "warn"}>
          {formateurValidation.valide ? "Validé par le formateur" : "Corrigé par le formateur"}
        </Badge>
      )}

      {feedback ? (
        <p className="feedback-apprenant">
          {feedbackShown}
          {feedback.length > FEEDBACK_TRUNCATE_LENGTH && (
            <>
              {" "}
              <button type="button" className="link" onClick={() => setExpanded((v) => !v)}>
                {expanded ? "voir moins" : "voir plus"}
              </button>
            </>
          )}
        </p>
      ) : (
        <p className="muted small">Pas de feedback disponible pour cette évaluation.</p>
      )}
    </div>
  );
}
