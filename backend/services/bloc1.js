const { execFile } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const BLOC1_DIR = path.join(__dirname, "..", "..", "bloc1_ml");

function resolvePythonBin() {
  const configured = process.env.PYTHON_BIN || "python3";
  if (configured.startsWith(".")) {
    return path.resolve(__dirname, "..", configured);
  }
  return configured;
}

function writeFilesToTmpDir(files) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "competencymentor-"));
  for (const [relPath, content] of Object.entries(files)) {
    const fullPath = path.join(tmpDir, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, "utf-8");
  }
  return tmpDir;
}

/**
 * Appelle predict_bloc1.py en sous-processus sur un dossier déjà existant
 * (ne gère pas sa création/suppression — à la charge de l'appelant).
 * Retourne { prediction, error } : en cas d'echec (venv absent, script en
 * erreur...), prediction est null et error contient le message precis
 * (stderr) pour debug - l'appelant continue sans bloquer (cas "cold start"
 * deja gere nativement par l'agent Bloc 2).
 */
function runBloc1PredictionOnDir(repoDir) {
  return new Promise((resolve) => {
    const pythonBin = resolvePythonBin();
    const scriptPath = path.join(BLOC1_DIR, "predict_bloc1.py");

    execFile(
      pythonBin,
      [scriptPath, "--repo-dir", repoDir],
      { cwd: BLOC1_DIR, maxBuffer: 10 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) {
          resolve({
            prediction: null,
            error: `predict_bloc1.py a échoué (PYTHON_BIN="${pythonBin}") : ${stderr || err.message}`,
          });
          return;
        }
        try {
          resolve({ prediction: JSON.parse(stdout), error: null });
        } catch (parseErr) {
          resolve({ prediction: null, error: `Sortie de predict_bloc1.py non-JSON : ${parseErr.message}\n${stdout}` });
        }
      }
    );
  });
}

/**
 * Ecrit les fichiers dans un dossier temporaire (créé et nettoyé ici), puis
 * appelle predict_bloc1.py dessus. Utilisé quand le code arrive déjà sous
 * forme de map { chemin: contenu } (soumission collée) plutôt que d'un
 * dossier existant (repo cloné, voir runBloc1PredictionOnDir).
 */
async function runBloc1Prediction(files) {
  let tmpDir;
  try {
    tmpDir = writeFilesToTmpDir(files);
  } catch (err) {
    return { prediction: null, error: `Écriture des fichiers temporaires échouée : ${err.message}` };
  }
  try {
    return await runBloc1PredictionOnDir(tmpDir);
  } finally {
    fs.rm(tmpDir, { recursive: true, force: true }, () => {});
  }
}

module.exports = { runBloc1Prediction, runBloc1PredictionOnDir };
