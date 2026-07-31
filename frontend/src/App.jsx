import { useState } from "react";
import EvaluateForm from "./components/EvaluateForm";
import ResultDisplay from "./components/ResultDisplay";
import AdminCompetences from "./components/AdminCompetences";
import "./App.css";

export default function App() {
  const [tab, setTab] = useState("evaluer");
  const [result, setResult] = useState(undefined);

  return (
    <div className="app">
      <header>
        <h1>CompetencyMentor AI</h1>
        <p className="muted">Évaluation de compétences pédagogiques assistée par ML + Agent LLM</p>
        <nav>
          <button className={tab === "evaluer" ? "active" : ""} onClick={() => setTab("evaluer")}>
            Évaluer
          </button>
          <button className={tab === "admin" ? "active" : ""} onClick={() => setTab("admin")}>
            Admin — Compétences
          </button>
        </nav>
      </header>

      <main>
        {tab === "evaluer" && (
          <div className="evaluer-layout">
            <EvaluateForm onResult={setResult} />
            {result === null && <p className="muted">Évaluation en cours…</p>}
            {result && (
              <ResultDisplay
                bloc1Prediction={result.bloc1Prediction}
                bloc1Warning={result.bloc1Warning}
                bloc2Result={result.bloc2Result}
              />
            )}
          </div>
        )}
        {tab === "admin" && <AdminCompetences />}
      </main>
    </div>
  );
}
