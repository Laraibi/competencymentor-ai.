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

- 17 dépôts GitHub réels d'apprenants ayant réalisé le brief "Quiz statique (Front-end)" (promotion Simplon/YouCode 2025-2026), anonymisables avant tout usage externe.
- Labels officiels récupérés depuis Simplonline (statut de validation de la compétence **C1 — Planifier le travail à effectuer individuellement**, la seule compétence relevée présentant une distribution de classes équilibrée : 8 invalidées / 9 validées).
- Une seconde cible (**qualité CSS/UI**) est dérivée du texte libre des feedbacks formateurs.

## 🧪 Bloc 1 — Modèle ML

- **Approche** : régression logistique univariée sur `nb_js_lines` (nombre de lignes de JavaScript), après tests de plusieurs jeux de features.
- **Résultat** : 59 % d'accuracy en validation leave-one-out (baseline hasard : 50 %).
- **Limite assumée** : avec seulement 17 échantillons, un modèle multivarié plus complexe (Random Forest, features CSS/DOM) sur-apprend et tombe sous la baseline — ce résultat, bien que modeste, est honnête et documenté (voir `bloc1_ml/train_bloc1.py`).
- Cette limite justifie précisément l'architecture hybride du projet : le Bloc 2 (agent) ne dépend pas d'un volume d'exemples d'entraînement pour raisonner sur une compétence, y compris une compétence entièrement nouvelle (voir "cold start" ci-dessous).

Reproduire :
```bash
cd bloc1_ml
pip install -r requirements.txt
python3 extract_features.py     # extrait les features des repos clonés
python3 train_bloc1.py          # entraîne et évalue le modèle (leave-one-out)
python3 predict_bloc1.py --repo-dir /chemin/vers/un/repo
```

## 🤖 Bloc 2 — Agent LLM

- Orchestration par tool calling (function calling) : l'agent appelle `check_code_criteria` (analyse statique objective du code) et `get_past_evaluations` (mémoire) avant de rendre son évaluation.
- Reçoit en contexte la prédiction du Bloc 1 et la confronte aux critères réels.
- Gère nativement le **cold start** : une compétence toute nouvelle, jamais entraînée, est évaluée directement par raisonnement — aucune donnée d'entraînement nécessaire.

Reproduire (nécessite une clé API, voir `.env.example`) :
```bash
cd bloc2_agent
npm install
node testAgent.mock.js   # test de la logique avec un client simulé (sans réseau)
```

## 🖥️ Démo

En cours de construction (`backend/`, `frontend/`) — API Node/Express + MongoDB + interface React.

## 📁 Structure du dépôt

```
├── docs/               cahier des charges
├── bloc1_ml/            modèle ML (Python)
├── bloc2_agent/          agent LLM (Node.js)
├── backend/             API Express + MongoDB (CRUD compétences/briefs/évaluations)
├── frontend/             interface React
└── README.md
```

## ⚠️ Limites connues et roadmap

- Volume de données limité (17 échantillons) — un futur travail sur davantage de briefs et de promotions permettrait un Bloc 1 plus robuste.
- Le MVP couvre 1 brief et 1-2 compétences ; la vision plus large (CRUD compétences générique, tout référentiel) est documentée dans le cahier des charges comme trajectoire d'évolution.

## Auteur

Développeur Full-Stack MERN & formateur — Simplon/YouCode.
