"""
Profil technique multi-critères (Bloc 1, extension).

Contrairement aux compétences CDA (C1, C2...) évaluées globalement par le
formateur, ce module dérive des critères TECHNIQUES récurrents entre les
briefs (organisation du code, documentation, responsive, bonus,
sophistication JS), directement issus des "Critères de performance" listés
dans les énoncés de brief. Comme ces critères reviennent d'un brief à
l'autre, on peut regrouper (pooler) les 26 échantillons disponibles au lieu
d'être limité aux échantillons d'un seul brief — plus de signal statistique,
et un profil plus riche et plus actionnable pour l'agent (Bloc 2) que
l'unique statut Validée/Invalidée d'une compétence CDA.

Chaque critère est un score de risque (z-score par rapport à la population
de référence), pas un verdict — cohérent avec le reste du Bloc 1
("Modèles calibrés sur seulement 26 échantillons — résultats indicatifs").
"""
import os
import subprocess
import numpy as np
import pandas as pd

BASE_DIR = os.path.dirname(__file__)
FEATURES_PATH = os.path.join(BASE_DIR, "features.csv")

CRITERIA = {
    "organisation_modularite": {
        "label": "Organisation & modularité du code",
        "features": ["nb_js_files", "nb_functions"],
        "brief_reference": "Bonne organisation et séparation du code (HTML/CSS/JS) — Sprint1 & JSQuiz Advanced (modules ES6)",
    },
    "documentation": {
        "label": "Documentation / commentaires",
        "features": ["comment_density"],
        "brief_reference": "Code clair, factorisé (DRY), bien commenté — critère explicite des deux briefs",
    },
    "responsive_design": {
        "label": "Interface responsive",
        "features": ["nb_media_queries"],
        "brief_reference": "Interface responsive, claire et ergonomique — critère explicite des deux briefs",
    },
    "sophistication_technique_js": {
        "label": "Sophistication technique JS (DOM, événements, localStorage, fetch)",
        "features": ["nb_addEventListener", "nb_queryselector", "uses_localstorage", "uses_fetch"],
        "brief_reference": "Utilisation correcte des concepts JS (DOM, événements, localStorage, fetch/async) — critère explicite des deux briefs",
    },
}

BONUS_FEATURES = ["has_dashboard_or_bonus", "has_pdf_export"]


def _z_score_composite(features_row, feature_names, ref_df):
    scores = []
    for f in feature_names:
        val = features_row.get(f, None)
        if val is None or f not in ref_df.columns:
            continue
        mean, std = ref_df[f].mean(), ref_df[f].std()
        if std == 0 or pd.isna(std):
            continue
        scores.append((val - mean) / std)
    if not scores:
        return None
    return round(float(np.mean(scores)), 2)


def _risk_label(score):
    if score is None:
        return "Non évaluable"
    if score < -0.6:
        return "Élevé (à vérifier en priorité)"
    if score < 0:
        return "Modéré"
    return "Faible"


def compute_technical_profile(features_row):
    """features_row : dict des features déjà extraites pour UN repo (voir extract_all_features)."""
    if not os.path.exists(FEATURES_PATH):
        return {"error": "features.csv introuvable — lance extract_features.py d'abord"}

    ref_df = pd.read_csv(FEATURES_PATH)

    profile = {}
    for key, cfg in CRITERIA.items():
        score = _z_score_composite(features_row, cfg["features"], ref_df)
        profile[key] = {
            "label": cfg["label"],
            "score_composite": score,
            "niveau_de_risque": _risk_label(score),
            "brief_reference": cfg["brief_reference"],
        }

    nb_bonus = sum(1 for f in BONUS_FEATURES if features_row.get(f))
    profile["fonctionnalites_bonus"] = {
        "label": "Fonctionnalités bonus réalisées",
        "nb_bonus_detectes": nb_bonus,
        "sur": len(BONUS_FEATURES),
        "brief_reference": "Bonus attendus (dashboard/classement, export PDF/CSV) — mentionnés dans les deux briefs",
    }

    return profile


def get_last_commit_date(repo_dir):
    """Info affichée mais NON pondérée dans les scores (signal potentiellement
    bruité par des commits post-soumission — voir README)."""
    try:
        out = subprocess.run(
            ["git", "-C", repo_dir, "log", "-1", "--format=%cI"],
            capture_output=True, text=True, timeout=5,
        )
        return out.stdout.strip() or None
    except Exception:
        return None
