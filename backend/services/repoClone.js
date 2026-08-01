const { execFile } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

// N'accepte que des URLs GitHub simples (https://github.com/user/repo[.git]) :
// évite qu'une chaîne commençant par "-" soit interprétée comme un flag git,
// et limite volontairement la fonctionnalité à ce qui a été demandé/testé.
const GITHUB_URL_REGEX = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/;

const CODE_FILE_REGEX = /\.(html|css|js)$/;

/**
 * Clone superficiellement (--depth 1) un repo GitHub dans un dossier
 * temporaire unique. Lance une erreur avec un message explicite en cas
 * d'URL invalide, de repo introuvable/privé, ou de timeout — nettoie le
 * dossier temporaire elle-même dans tous les cas d'échec (l'appelant n'a
 * à nettoyer que le dossier retourné en cas de succès).
 */
function cloneRepo(repoUrl) {
  return new Promise((resolve, reject) => {
    if (typeof repoUrl !== "string" || !GITHUB_URL_REGEX.test(repoUrl.trim())) {
      reject(new Error("repoUrl invalide — attendu au format https://github.com/user/repo"));
      return;
    }

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "competencymentor-clone-"));

    execFile(
      "git",
      ["clone", "--depth", "1", repoUrl.trim(), tmpDir],
      {
        timeout: 30_000,
        env: { ...process.env, GIT_TERMINAL_PROMPT: "0" }, // ne jamais attendre des identifiants (repo privé)
      },
      (err, stdout, stderr) => {
        if (err) {
          fs.rm(tmpDir, { recursive: true, force: true }, () => {});
          const reason = err.killed
            ? "délai de clonage dépassé (30s)"
            : (stderr || err.message).trim().split("\n").pop();
          reject(new Error(`clonage du repo échoué (${reason})`));
          return;
        }
        resolve(tmpDir);
      }
    );
  });
}

/**
 * Parcourt un dossier (repo cloné) et construit la map { cheminRelatif: contenu }
 * pour les fichiers .html/.css/.js, en excluant .git/.
 */
function loadFilesFromDir(rootDir) {
  const files = {};
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === ".git") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (CODE_FILE_REGEX.test(entry.name)) {
        files[path.relative(rootDir, full)] = fs.readFileSync(full, "utf-8");
      }
    }
  }
  walk(rootDir);
  return files;
}

module.exports = { cloneRepo, loadFilesFromDir };
