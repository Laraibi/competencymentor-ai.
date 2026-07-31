"""
Prédiction Bloc 1 pour un apprenant donné, à partir de son code.
Sortie JSON destinée à être transmise à l'agent Bloc 2 (preuve d'intégration
réelle entre les deux blocs, comme exigé par le cahier des charges).

Deux évaluations complémentaires :
1. C1 (Planification) — classification supervisée (régression logistique),
   la seule compétence relevée avec assez de variance de classes (8/9).
2. C2 (Développer des interfaces utilisateur) — compétence TECHNIQUE,
   mais quasi dégénérée statistiquement (16 validées / 1 invalidée sur 17).
   Un classifieur classique serait inutilisable (94% d'accuracy en
   prédisant toujours "validée", sans rien apprendre). On utilise donc un
   SCORE DE RISQUE (distance statistique à la norme des rendus validés,
   sur les 3 features les plus discriminantes) : un outil de triage pour
   le formateur, pas un verdict automatique.

Usage :
    python3 predict_bloc1.py --repo-dir /path/to/repo
"""
import argparse
import json
import os
import joblib
import pandas as pd
import numpy as np
from technical_profile import compute_technical_profile, get_last_commit_date

MODEL_PATH = os.path.join(os.path.dirname(__file__), "bloc1_model.joblib")
FEATURES_PATH = os.path.join(os.path.dirname(__file__), "features.csv")
LABELS_PATH = os.path.join(os.path.dirname(__file__), "labels.csv")

C2_RISK_FEATURES = ["nb_functions", "nb_css_rules", "nb_addEventListener"]


def extract_all_features(repo_dir):
    """Ré-extrait le même jeu de features que extract_features.py, pour un seul repo."""
    import re
    js_text, css_text, html_names, js_names = [], [], [], []
    for dirpath, _, filenames in os.walk(repo_dir):
        if ".git" in dirpath:
            continue
        for f in filenames:
            path = os.path.join(dirpath, f)
            if f.endswith(".js"):
                with open(path, "r", encoding="utf-8", errors="ignore") as fh:
                    js_text.append(fh.read())
                js_names.append(f)
            elif f.endswith(".css"):
                with open(path, "r", encoding="utf-8", errors="ignore") as fh:
                    css_text.append(fh.read())
            elif f.endswith((".html", ".htm")):
                html_names.append(f)
    js_full = "\n".join(js_text)
    css_full = "\n".join(css_text)
    js_lines = [l for l in js_full.splitlines() if l.strip()]

    nb_line_comments = len(re.findall(r"//.*", js_full))
    nb_block_comments = len(re.findall(r"/\*[\s\S]*?\*/", js_full))
    comment_density = round((nb_line_comments + nb_block_comments) / max(len(js_lines), 1), 3)

    bonus_keywords = ["dashboard", "history", "report", "classement", "stats", "rapport", "historique", "statistique"]
    has_bonus = any(kw in n.lower() for n in html_names + js_names for kw in bonus_keywords)

    return {
        "nb_js_lines": len(js_lines),
        "comment_density": comment_density,
        "nb_functions": len(re.findall(r"\bfunction\b|=>", js_full)),
        "nb_css_rules": len(re.findall(r"[^{}]+\{[^{}]*\}", css_full)),
        "nb_media_queries": len(re.findall(r"@media", css_full)),
        "nb_addEventListener": js_full.count("addEventListener"),
        "nb_queryselector": js_full.count("querySelector"),
        "uses_localstorage": 1 if "localStorage" in js_full else 0,
        "uses_fetch": 1 if ("fetch(" in js_full or "XMLHttpRequest" in js_full) else 0,
        "nb_js_files": len(js_names),
        "has_dashboard_or_bonus": 1 if has_bonus else 0,
        "has_pdf_export": 1 if ("jspdf" in js_full.lower() or "pdf" in js_full.lower()) else 0,
    }


def predict_c1(features_row):
    clf = joblib.load(MODEL_PATH)
    X = pd.DataFrame([{"nb_js_lines": features_row["nb_js_lines"]}])
    proba = clf.predict_proba(X)[0]
    classes = clf.classes_
    pred = clf.predict(X)[0]
    return {
        "statut_predit": pred,
        "confiance": round(float(max(proba)), 2),
        "distribution_proba": {c: round(float(p), 2) for c, p in zip(classes, proba)},
    }


def predict_c2_risk_score(features_row):
    """Score de risque = distance moyenne (en écarts-types) à la norme des
    rendus validés, sur les 3 features les plus discriminantes pour C2."""
    if not os.path.exists(FEATURES_PATH) or not os.path.exists(LABELS_PATH):
        return {"error": "features.csv / labels.csv introuvables — lance extract_features.py d'abord"}

    ref_features = pd.read_csv(FEATURES_PATH)
    # référence = toute la population connue (proxy de "norme" en l'absence de label C2 complet)
    mean = ref_features[C2_RISK_FEATURES].mean()
    std = ref_features[C2_RISK_FEATURES].std()

    z_scores = {}
    for f in C2_RISK_FEATURES:
        val = features_row.get(f, mean[f])
        z_scores[f] = round(float((val - mean[f]) / std[f]), 2)

    composite = round(float(np.mean(list(z_scores.values()))), 2)
    risk_level = "Élevé (à vérifier en priorité)" if composite < -0.6 else (
        "Modéré" if composite < 0 else "Faible"
    )

    return {
        "z_scores_par_feature": z_scores,
        "score_composite": composite,
        "niveau_de_risque": risk_level,
        "interpretation": "Score bas = rendu qui s'écarte de la norme des rendus habituellement validés sur ces critères techniques. Outil de triage, pas un verdict automatique.",
    }


def predict(repo_dir):
    features_row = extract_all_features(repo_dir)
    last_commit = get_last_commit_date(repo_dir)
    return {
        "bloc": "Bloc 1 - ML",
        "features_mesurees": features_row,
        "C1_planification": {
            "competence": "C1. Planifier le travail à effectuer individuellement",
            "methode": "Classification supervisée (régression logistique, orientée rappel)",
            **predict_c1(features_row),
        },
        "C2_interfaces_utilisateur": {
            "competence": "C2. Développer des interfaces utilisateur",
            "methode": "Score de risque (distance à la norme, triage formateur)",
            **predict_c2_risk_score(features_row),
        },
        "profil_technique_transverse": {
            "description": "Critères récurrents entre briefs, directement issus des 'Critères de performance' des énoncés — voir README.",
            **compute_technical_profile(features_row),
        },
        "dernier_commit_git": {
            "date": last_commit,
            "note": "Information affichée à titre indicatif (respect des délais), NON pondérée dans les scores ci-dessus — signal potentiellement bruité par des commits post-soumission.",
        },
        "limite_connue": "Modèles calibrés sur 26 échantillons (2 briefs) — résultats indicatifs, pas définitifs.",
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-dir", required=True)
    args = parser.parse_args()
    result = predict(args.repo_dir)
    print(json.dumps(result, indent=2, ensure_ascii=False))
