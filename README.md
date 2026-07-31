# CompetencyMentor AI

Assistant IA d'évaluation de compétences par l'analyse de code, aligné sur le référentiel pédagogique utilisé chez Simplon/YouCode.

Projet Fil Rouge — formation ML / DL / NLP / LLM / Agents / RAG.

📄 Cahier des charges complet : [`docs/Cahier_des_charges_CompetencyMentor_AI.docx`](docs/Cahier_des_charges_CompetencyMentor_AI.docx)

## 🎯 Le problème

Dans un centre de formation au développement, chaque brief projet vise un sous-ensemble de compétences du référentiel officiel. Le formateur doit évaluer, pour chaque apprenant, si la compétence est acquise — un travail manuel et chronophage. CompetencyMentor AI automatise une première évaluation à partir du code soumis, en gardant le formateur dans la boucle de validation.

## 🧩 Architecture (Bloc 1 + Bloc 2)

```
              Code source de l'apprenant (repo GitHub)
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
      Bloc 1 — Modèle ML          Bloc 2 — Agent LLM
   (bloc1_ml/predict_bloc1.py)   (bloc2_agent/agent.js)
   Prédit le statut C1              Tool calling :
   (Planification) à partir       - check_code_criteria
   du code, avec un score          - get_past_evaluations
   de confiance.                  Reçoit la prédiction du
              │                    Bloc 1 en contexte,
              └────────────────► raisonne dessus, et rend
                                  un feedback pédagogique
                                  structuré (JSON).
```

Le score du Bloc 1 est transmis en entrée de l'agent du Bloc 2 (`bloc1Prediction`), qui le confronte aux critères réels du code avant de conclure — les deux blocs sont réellement intégrés dans le même cas d'usage, pas juxtaposés.

## 📊 Données

- 26 dépôts GitHub réels d'apprenants (17 sur le brief "Quiz statique (Front-end)" + 9 échantillons distincts supplémentaires sur "JSQuiz Advanced"), promotion Simplon/YouCode 2025-2026, anonymisables avant tout usage externe.
- Labels officiels récupérés depuis Simplonline pour la compétence **C1 — Planifier le travail à effectuer individuellement** (distribution déséquilibrée sur les 26 échantillons : 17 validées / 9 invalidées).
- Pas de label complet disponible pour **C2 — Développer des interfaces utilisateur** : le Bloc 1 en dérive un score de risque statistique plutôt qu'une classification (voir ci-dessous).

## 🧪 Bloc 1 — Modèle ML

Deux évaluations complémentaires, plus un profil technique transverse :

- **C1 (Planification)** : régression logistique univariée sur `nb_js_lines`, **pondérée** (`class_weight="balanced"`) et **orientée rappel**. Sur les 26 échantillons (17 validées / 9 invalidées, baseline classe majoritaire = 0,65), l'accuracy en leave-one-out est de **0,50** — sous la baseline — mais le **rappel sur la classe Invalidée atteint 0,78** : l'objectif assumé n'est pas un verdict précis à 100 %, mais de ne rater aucun apprenant en difficulté, quitte à générer plus de faux positifs revus ensuite par le formateur. Résultats détaillés dans `bloc1_ml/train_bloc1.py`.
- **C2 (Interfaces utilisateur)** : compétence quasi dégénérée statistiquement dans les données disponibles (un classifieur classique prédirait "validée" en permanence sans rien apprendre). Le Bloc 1 calcule donc un **score de risque** : distance moyenne, en écarts-types, à la norme des rendus validés sur les 3 features les plus discriminantes (`nb_functions`, `nb_css_rules`, `nb_addEventListener`) — un outil de triage pour le formateur, pas un verdict automatique.
- **Profil technique transverse** : critères récurrents entre les deux briefs (organisation/modularité, documentation, interface responsive, sophistication technique JS, fonctionnalités bonus), calculés en z-score sur l'ensemble des 26 échantillons poolés. Cela donne un signal plus riche et actionnable pour l'agent (Bloc 2) que le seul statut Validée/Invalidée d'une compétence CDA (voir `bloc1_ml/technical_profile.py`).
- **Limite assumée** : avec seulement 26 échantillons et des classes déséquilibrées, ces résultats sont indicatifs, pas définitifs — cette limite justifie précisément l'architecture hybride du projet : le Bloc 2 (agent) ne dépend pas d'un volume d'exemples d'entraînement pour raisonner sur une compétence, y compris une compétence entièrement nouvelle (voir "cold start" ci-dessous).

Reproduire (le venv `bloc1_ml/venv` et les repos clonés `bloc1_ml/sample_repos/` ne sont pas versionnés — voir `.gitignore` — il faut les recréer) :
```bash
cd bloc1_ml
python3 -m venv venv                          # si pas déjà fait
venv/bin/pip install -r requirements.txt
./clone_sample_repos.sh                       # clone les 26 repos réels (nécessaire à extract_features.py)
venv/bin/python3 extract_features.py          # régénère features.csv à partir des repos clonés
venv/bin/python3 train_bloc1.py               # entraîne et évalue le modèle (leave-one-out)
venv/bin/python3 predict_bloc1.py --repo-dir sample_repos/fouadlamrini_-JSQuizStarter
```

## 🤖 Bloc 2 — Agent LLM

- Orchestration par tool calling (function calling) : l'agent appelle `check_code_criteria` (analyse statique objective du code) et `get_past_evaluations` (mémoire) avant de rendre son évaluation.
- Reçoit en contexte la prédiction du Bloc 1 et la confronte aux critères réels.
- Gère nativement le **cold start** : une compétence toute nouvelle, jamais entraînée, est évaluée directement par raisonnement — aucune donnée d'entraînement nécessaire.

Reproduire :
```bash
cd bloc2_agent
npm install
node testAgent.mock.js   # test de la logique avec un client simulé (sans réseau, sans clé API)
```

Test d'intégration réelle (Bloc 1 + Bloc 2 chaînés, vrai appel OpenAI — nécessite une clé API dans `bloc2_agent/.env`, voir `.env.example`, et les repos clonés via `bloc1_ml/clone_sample_repos.sh`) :
```bash
node testAgent.real.js fouadlamrini_-JSQuizStarter
```

## 🖥️ Démo

API Node/Express + MongoDB Atlas + interface React, connectées bout en bout : soumission de code → Bloc 1 (Python, sous-processus) → Bloc 2 (agent LLM) → affichage du résultat combiné.

### Lancement en local (mode développement)

**Prérequis** : Node.js 18+, Python 3, une clé API OpenAI, un venv Python pour `bloc1_ml` avec pandas/scikit-learn/joblib installés (voir commandes ci-dessus dans la section Bloc 1 — `python3 -m venv venv && venv/bin/pip install -r bloc1_ml/requirements.txt`).

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env   # renseigner MONGODB_URI (Atlas), OPENAI_API_KEY ; PYTHON_BIN pointe déjà vers ../bloc1_ml/venv/bin/python3
npm start               # démarre sur http://localhost:4000
```

```bash
# 2. Frontend (autre terminal)
cd frontend
npm install
npm run dev              # démarre sur http://localhost:5173
```

> `MONGODB_URI` est optionnelle : sans elle (ou si la connexion échoue), l'API démarre quand même et `/api/evaluate` fonctionne sans persistance — seul le CRUD compétences/briefs et l'historique nécessitent une base connectée.

### Lancement avec Docker (image tout-en-un)

```bash
docker build -t competencymentor-ai .
docker run -p 4000:4000 --env-file backend/.env competencymentor-ai
```

L'image embarque le backend, le venv Python du Bloc 1 (créé pendant le build) et le build statique du frontend (servi directement par Express) : une seule commande, http://localhost:4000. `--env-file backend/.env` réutilise le fichier créé à l'étape précédente (`OPENAI_API_KEY`, `OPENAI_MODEL`, `MONGODB_URI`) — pas besoin de repasser les variables une à une. `PYTHON_BIN` du `.env` reste valide dans le conteneur car `backend/` et `bloc1_ml/` y gardent la même position relative que dans le dépôt.

### Endpoints principaux

| Méthode | Route | Rôle |
|---|---|---|
| `POST` | `/api/evaluate` | Route centrale : Bloc 1 (prédiction ML) + Bloc 2 (agent LLM) sur un code soumis |
| `POST` | `/api/soumissions` | Enregistre une soumission de code |
| `GET` | `/api/evaluations/:studentName` | Historique des évaluations d'un apprenant |
| CRUD | `/api/competences`, `/api/briefs` | Gestion du référentiel (admin) |

## 📁 Structure du dépôt

```
├── docs/               cahier des charges
├── bloc1_ml/            modèle ML (Python)
├── bloc2_agent/          agent LLM (Node.js)
├── backend/             API Express + MongoDB (CRUD compétences/briefs/évaluations)
├── frontend/             interface React
├── Dockerfile            image tout-en-un (backend + Bloc 1 + frontend buildé)
└── README.md
```

## ⚠️ Limites connues et roadmap

- Volume de données limité (26 échantillons, 2 briefs) — un futur travail sur davantage de briefs et de promotions permettrait un Bloc 1 plus robuste.
- Le MVP couvre 2 briefs et 2 compétences (C1, C2) ; la vision plus large (CRUD compétences générique, tout référentiel) est documentée dans le cahier des charges comme trajectoire d'évolution.

## Auteur

Développeur Full-Stack MERN & formateur — Simplon/YouCode.
