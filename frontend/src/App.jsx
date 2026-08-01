import { useEffect, useState } from "react";
import EvaluateForm from "./components/EvaluateForm";
import ResultDisplay from "./components/ResultDisplay";
import AdminCompetences from "./components/AdminCompetences";
import History from "./components/History";
import { api } from "./api";
import "./App.css";

export default function App() {
  const [tab, setTab] = useState("evaluer");
  const [result, setResult] = useState(undefined);
  const [pastEvaluationsCount, setPastEvaluationsCount] = useState(0);

  useEffect(() => {
    if (!result || !result.studentName) {
      setPastEvaluationsCount(0);
      return;
    }
    api
      .getEvaluations(result.studentName)
      .then((data) => setPastEvaluationsCount(Math.max(0, data.length - 1)))
      .catch(() => setPastEvaluationsCount(0));
  }, [result]);

  return (
    <div className="app">
      <header>
        <h1>CompetencyMentor AI</h1>
        <p className="muted">Évaluation de compétences pédagogiques assistée par ML + Agent LLM</p>
        <nav>
          <button className={tab === "evaluer" ? "active" : ""} onClick={() => setTab("evaluer")}>
            Évaluer
          </button>
          <button className={tab === "historique" ? "active" : ""} onClick={() => setTab("historique")}>
            Historique
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
                pastEvaluationsCount={pastEvaluationsCount}
              />
            )}
          </div>
        )}
        {tab === "historique" && <History />}
        {tab === "admin" && <AdminCompetences />}
      </main>
    </div>
  );
}
