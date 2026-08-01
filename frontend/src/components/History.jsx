import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import EvaluationCard from "./EvaluationCard";

const DEBOUNCE_MS = 400;

export default function History() {
  const [studentName, setStudentName] = useState("");
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef(null);

  async function runSearch(name) {
    const trimmed = name.trim();
    if (!trimmed) {
      setEvaluations([]);
      setSearched(false);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await api.getEvaluations(trimmed);
      setEvaluations(data);
    } catch (err) {
      setError(err.message);
      setEvaluations([]);
    } finally {
      setSearched(true);
      setLoading(false);
    }
  }

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(studentName), DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentName]);

  function handleSubmit(e) {
    e.preventDefault();
    clearTimeout(debounceRef.current);
    runSearch(studentName);
  }

  return (
    <div className="history">
      <form className="card" onSubmit={handleSubmit}>
        <h3>Historique des évaluations</h3>
        <label>
          Nom de l'apprenant
          <div className="search-row">
            <input
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="ex. Fouad Lamrini"
            />
            <button type="submit" disabled={loading}>
              {loading ? "Recherche…" : "Rechercher"}
            </button>
          </div>
        </label>
      </form>

      {error && (
        <div className="card card-warning">
          <p className="error">⚠️ {error}</p>
        </div>
      )}

      {!error && searched && !loading && evaluations.length === 0 && (
        <div className="card">
          <p className="muted">Aucune évaluation trouvée pour cet apprenant.</p>
        </div>
      )}

      {evaluations.length > 0 && (
        <div className="history-list">
          {evaluations.map((ev) => (
            <EvaluationCard key={ev._id} evaluation={ev} />
          ))}
        </div>
      )}
    </div>
  );
}
