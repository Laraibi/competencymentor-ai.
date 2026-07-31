import { useEffect, useState } from "react";
import { api } from "../api";

const EMPTY_FORM = { code: "", libelle: "", description: "", niveauxAttendus: "" };

export default function AdminCompetences() {
  const [competences, setCompetences] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  function refresh() {
    api.getCompetences().then(setCompetences).catch((err) => setError(err.message));
  }

  useEffect(refresh, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const payload = {
      code: form.code.trim(),
      libelle: form.libelle.trim(),
      description: form.description.trim(),
      niveauxAttendus: form.niveauxAttendus.split(",").map((s) => s.trim()).filter(Boolean),
    };
    try {
      if (editingId) {
        await api.updateCompetence(editingId, payload);
      } else {
        await api.createCompetence(payload);
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleEdit(c) {
    setEditingId(c._id);
    setForm({
      code: c.code,
      libelle: c.libelle,
      description: c.description,
      niveauxAttendus: (c.niveauxAttendus || []).join(", "),
    });
  }

  async function handleDelete(id) {
    setError("");
    try {
      await api.deleteCompetence(id);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="admin">
      <form className="card" onSubmit={handleSubmit}>
        <h3>{editingId ? "Modifier la compétence" : "Nouvelle compétence"}</h3>
        <label>
          Code
          <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="ex. C2" />
        </label>
        <label>
          Libellé
          <input value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} />
        </label>
        <label>
          Description
          <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>
        <label>
          Niveaux attendus (séparés par des virgules)
          <input
            value={form.niveauxAttendus}
            onChange={(e) => setForm({ ...form, niveauxAttendus: e.target.value })}
            placeholder="Niveau 1, Niveau 2"
          />
        </label>
        {error && <p className="error">{error}</p>}
        <div className="button-row">
          <button type="submit">{editingId ? "Enregistrer" : "Ajouter"}</button>
          {editingId && (
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setEditingId(null);
                setForm(EMPTY_FORM);
              }}
            >
              Annuler
            </button>
          )}
        </div>
      </form>

      <div className="card">
        <h3>Compétences enregistrées</h3>
        {competences.length === 0 && <p className="muted">Aucune compétence (ou base non connectée).</p>}
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Libellé</th>
              <th>Niveaux</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {competences.map((c) => (
              <tr key={c._id}>
                <td>{c.code}</td>
                <td>{c.libelle}</td>
                <td>{(c.niveauxAttendus || []).join(", ")}</td>
                <td>
                  <button type="button" className="link" onClick={() => handleEdit(c)}>
                    Modifier
                  </button>
                  <button type="button" className="link danger" onClick={() => handleDelete(c._id)}>
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
