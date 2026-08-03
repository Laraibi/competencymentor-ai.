import { Fragment, useEffect, useState } from "react";
import { api } from "../api";
import Badge, { statutToLevel } from "./Badge";

export default function History() {
  const [allEvaluations, setAllEvaluations] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    api
      .getAllEvaluations()
      .then(setAllEvaluations)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filterText.trim()
    ? allEvaluations.filter((ev) => (ev.studentName || "").toLowerCase().includes(filterText.trim().toLowerCase()))
    : allEvaluations;

  return (
    <div className="history">
      <div className="card">
        <h3>Historique des évaluations</h3>
        <form onSubmit={(e) => e.preventDefault()}>
          <label>
            Filtrer par nom d'apprenant
            <input
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="laisser vide pour tout afficher"
            />
          </label>
        </form>
      </div>

      {loading && <p className="muted">Chargement…</p>}

      {error && (
        <div className="card card-warning">
          <p className="error">⚠️ {error}</p>
        </div>
      )}

      {!loading && !error && allEvaluations.length === 0 && (
        <div className="card">
          <p className="muted">Aucune évaluation enregistrée pour le moment.</p>
        </div>
      )}

      {!loading && !error && allEvaluations.length > 0 && filtered.length === 0 && (
        <div className="card">
          <p className="muted">Aucune évaluation ne correspond à « {filterText} ».</p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="card history-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Apprenant</th>
                <th>Compétence</th>
                <th>Statut</th>
                <th>Niveau</th>
                <th>Date</th>
                <th>Formateur</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ev) => {
                const isOpen = expandedId === ev._id;
                const competence = ev.bloc2Result?.competence || ev.competenceCode;
                const statut = ev.bloc2Result?.statut;
                const niveau = ev.bloc2Result?.niveau_estime;
                const feedback = ev.bloc2Result?.feedback_apprenant;
                const justification = ev.bloc2Result?.justification;
                const hasValidation =
                  ev.formateurValidation && ev.formateurValidation.valide !== null && ev.formateurValidation.valide !== undefined;

                return (
                  <Fragment key={ev._id}>
                    <tr>
                      <td>{ev.studentName || "—"}</td>
                      <td>{competence || "—"}</td>
                      <td>{statut ? <Badge level={statutToLevel(statut)}>{statut}</Badge> : "—"}</td>
                      <td>{niveau || "—"}</td>
                      <td>{ev.dateEvaluation ? new Date(ev.dateEvaluation).toLocaleString("fr-FR") : "—"}</td>
                      <td>
                        {hasValidation ? (
                          <Badge level={ev.formateurValidation.valide ? "good" : "warn"}>
                            {ev.formateurValidation.valide ? "Validé" : "Corrigé"}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <button type="button" className="link" onClick={() => setExpandedId(isOpen ? null : ev._id)}>
                          {isOpen ? "masquer" : "détails"}
                        </button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="history-detail-row">
                        <td colSpan={7}>
                          <p className="feedback-apprenant">{feedback || "Pas de feedback disponible pour cette évaluation."}</p>
                          {justification && (
                            <p className="muted small">
                              <strong>Justification :</strong> {justification}
                            </p>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
