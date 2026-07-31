const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `Erreur HTTP ${res.status}`);
  }
  return data;
}

export const api = {
  evaluate: (payload) => request("/evaluate", { method: "POST", body: JSON.stringify(payload) }),
  getCompetences: () => request("/competences"),
  createCompetence: (payload) => request("/competences", { method: "POST", body: JSON.stringify(payload) }),
  updateCompetence: (id, payload) => request(`/competences/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteCompetence: (id) => request(`/competences/${id}`, { method: "DELETE" }),
};
