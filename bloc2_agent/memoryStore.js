/**
 * Mémoire de l'agent : historique des évaluations par apprenant.
 * Version MVP : fichier JSON local. À remplacer par une collection MongoDB
 * (`evaluations`) dans l'intégration finale avec le backend Express.
 */
const fs = require("fs");
const path = require("path");

const STORE_PATH = path.join(__dirname, "memory_store.json");

function loadStore() {
  if (!fs.existsSync(STORE_PATH)) return {};
  return JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
}

function saveStore(store) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

function getPastEvaluations(studentName) {
  const store = loadStore();
  return store[studentName] || [];
}

function addEvaluation(studentName, evaluation) {
  const store = loadStore();
  if (!store[studentName]) store[studentName] = [];
  store[studentName].push({ ...evaluation, date: new Date().toISOString() });
  saveStore(store);
}

module.exports = { getPastEvaluations, addEvaluation };
