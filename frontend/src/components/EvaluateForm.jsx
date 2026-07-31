import { useEffect, useState } from "react";
import { api } from "../api";
import { parseFilesText, EXAMPLE_TEMPLATE } from "../parseFiles";

const DEFAULT_BRIEF_CRITERIA = `- Quiz fonctionnel (score calculé + feedback affiché)
- Respect du nombre minimum de questions/thématique (>= 10)
- Bonne organisation et séparation du code (HTML/CSS/JS)
- Interface responsive, claire et ergonomique
- Utilisation correcte des concepts de base JS (DOM, événements, conditions, boucles, persistance des données en localStorage)
- Respect des délais (4 jours)`;

const NEW_COMPETENCE_VALUE = "__new__";

export default function EvaluateForm({ onResult }) {
  const [studentName, setStudentName] = useState("");
  const [code, setCode] = useState(EXAMPLE_TEMPLATE);
  const [competences, setCompetences] = useState([]);
  const [selectedCompetence, setSelectedCompetence] = useState("");
  const [newCompetenceText, setNewCompetenceText] = useState("");
  const [briefCriteria, setBriefCriteria] = useState(DEFAULT_BRIEF_CRITERIA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getCompetences().then(setCompetences).catch(() => setCompetences([]));
  }, []);

  const isColdStart = selectedCompetence === NEW_COMPETENCE_VALUE || (!selectedCompetence && competences.length === 0);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const files = parseFilesText(code);
    if (!studentName.trim()) return setError("Le nom de l'apprenant est requis.");
    if (Object.keys(files).length === 0) return setError("Le code soumis est vide.");
    if (isColdStart && !newCompetenceText.trim()) return setError("Décris la nouvelle compétence à évaluer.");
    if (!isColdStart && !selectedCompetence) return setError("Sélectionne une compétence.");

    const payload = {
      studentName: studentName.trim(),
      files,
      briefCriteria,
      ...(isColdStart
        ? { competenceDescription: newCompetenceText.trim() }
        : { competenceCode: selectedCompetence }),
    };

    setLoading(true);
    onResult(null);
    try {
      const result = await api.evaluate(payload);
      onResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h3>Nouvelle évaluation</h3>

      <label>
        Nom de l'apprenant
        <input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="ex. Fouad Lamrini" />
      </label>

      <label>
        Code soumis (fichiers séparés par des marqueurs <code>### nom_du_fichier</code>)
        <textarea rows={12} value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false} />
      </label>

      <label>
        Compétence à évaluer
        <select
          value={selectedCompetence}
          onChange={(e) => setSelectedCompetence(e.target.value)}
        >
          <option value="">-- Choisir --</option>
          {competences.map((c) => (
            <option key={c._id} value={c.code}>
              {c.code} — {c.libelle}
            </option>
          ))}
          <option value={NEW_COMPETENCE_VALUE}>➕ Nouvelle compétence (cold start)</option>
        </select>
      </label>

      {isColdStart && (
        <label>
          Description de la nouvelle compétence
          <textarea
            rows={2}
            value={newCompetenceText}
            onChange={(e) => setNewCompetenceText(e.target.value)}
            placeholder="ex. C9. Mettre en place une démarche de veille technologique"
          />
        </label>
      )}

      <label>
        Critères de performance du brief
        <textarea rows={6} value={briefCriteria} onChange={(e) => setBriefCriteria(e.target.value)} />
      </label>

      {error && <p className="error">{error}</p>}

      <button type="submit" disabled={loading}>
        {loading ? "Évaluation en cours…" : "Évaluer"}
      </button>
    </form>
  );
}
