/**
 * Test de l'agent Bloc 2 avec le VRAI client OpenAI (pas de mock).
 * Ce script appelle aussi le Bloc 1 (Python) en sous-processus pour obtenir
 * une vraie prédiction, prouvant l'intégration bout en bout des deux blocs.
 *
 * Prérequis :
 *   - .env avec OPENAI_API_KEY (voir .env.example)
 *   - npm install openai dotenv
 *   - Le dossier ../bloc1_ml/sample_repos doit exister (voir clone_sample_repos.sh)
 *
 * Usage :
 *   node testAgent.real.js [nom_du_dossier_repo]
 *   node testAgent.real.js fouadlamrini_-JSQuizStarter
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const OpenAI = require("openai");
const { evaluateCompetence } = require("./agent");

const BLOC1_DIR = path.join(__dirname, "..", "bloc1_ml");
const SAMPLE_REPOS_DIR = path.join(BLOC1_DIR, "sample_repos");

function loadRepoFiles(repoDir) {
  const files = {};
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === ".git") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (/\.(html|css|js)$/.test(entry.name)) {
        files[path.relative(repoDir, full)] = fs.readFileSync(full, "utf-8");
      }
    }
  }
  walk(repoDir);
  return files;
}

function getBloc1Prediction(repoDir) {
  try {
    const out = execSync(
      `python3 predict_bloc1.py --repo-dir "${repoDir}"`,
      { cwd: BLOC1_DIR, encoding: "utf-8" }
    );
    return JSON.parse(out);
  } catch (e) {
    console.warn("⚠️  Impossible d'obtenir la prédiction du Bloc 1 (agent testé sans elle) :", e.message);
    return null;
  }
}

const BRIEF_CRITERIA = `
- Quiz fonctionnel (score calculé + feedback affiché)
- Respect du nombre minimum de questions/thématique (>= 10)
- Bonne organisation et séparation du code (HTML/CSS/JS)
- Interface responsive, claire et ergonomique
- Utilisation correcte des concepts de base JS (DOM, événements, conditions, boucles, persistance des données en localStorage)
- Respect des délais (4 jours)`;

async function main() {
  const repoName = process.argv[2] || "fouadlamrini_-JSQuizStarter";
  const repoDir = path.join(SAMPLE_REPOS_DIR, repoName);

  if (!fs.existsSync(repoDir)) {
    console.error(`Repo introuvable : ${repoDir}`);
    console.error(`Vérifie que ${SAMPLE_REPOS_DIR} existe (lance clone_sample_repos.sh dans bloc1_ml/)`);
    process.exit(1);
  }
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY manquante — vérifie ton fichier .env");
    process.exit(1);
  }

  console.log(`\n📂 Repo testé : ${repoName}`);
  const files = loadRepoFiles(repoDir);
  console.log(`   ${Object.keys(files).length} fichiers chargés (${Object.keys(files).join(", ")})`);

  console.log(`\n🐍 Appel du Bloc 1 (Python) pour obtenir une vraie prédiction...`);
  const bloc1Prediction = getBloc1Prediction(repoDir);
  if (bloc1Prediction) {
    console.log(`   C1: ${bloc1Prediction.C1_planification.statut_predit} (confiance ${bloc1Prediction.C1_planification.confiance})`);
    console.log(`   C2: risque ${bloc1Prediction.C2_interfaces_utilisateur.niveau_de_risque}`);
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  console.log(`\n🤖 Appel de l'agent (Bloc 2) avec le vrai modèle ${process.env.OPENAI_MODEL || "gpt-4o-mini"}...`);
  const result = await evaluateCompetence(client, {
    studentName: repoName,
    files,
    competenceDescription: "C2. Développer des interfaces utilisateur",
    briefCriteria: BRIEF_CRITERIA,
    bloc1Prediction,
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
  });

  console.log("\n=== Résultat final de l'agent ===");
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error("Erreur:", err);
  process.exit(1);
});
