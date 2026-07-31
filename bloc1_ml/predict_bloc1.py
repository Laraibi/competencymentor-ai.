"""
Prédiction Bloc 1 pour un apprenant donné, à partir de son code.
Sortie JSON destinée à être transmise à l'agent Bloc 2 (preuve d'intégration
réelle entre les deux blocs, comme exigé par le cahier des charges).

Usage :
    python3 predict_bloc1.py --repo-dir /path/to/repo
"""
import argparse
import json
import os
import re
import joblib
import pandas as pd

MODEL_PATH = os.path.join(os.path.dirname(__file__), "bloc1_model.joblib")


def extract_nb_js_lines(repo_dir):
    js_text = []
    for dirpath, _, filenames in os.walk(repo_dir):
        if ".git" in dirpath:
            continue
        for f in filenames:
            if f.endswith(".js"):
                with open(os.path.join(dirpath, f), "r", encoding="utf-8", errors="ignore") as fh:
                    js_text.append(fh.read())
    full = "\n".join(js_text)
    return len([l for l in full.splitlines() if l.strip()])


def predict(repo_dir):
    clf = joblib.load(MODEL_PATH)
    nb_js_lines = extract_nb_js_lines(repo_dir)
    X = pd.DataFrame([{"nb_js_lines": nb_js_lines}])
    proba = clf.predict_proba(X)[0]
    classes = clf.classes_
    pred = clf.predict(X)[0]
    confidence = float(max(proba))

    return {
        "bloc": "Bloc 1 - ML",
        "competence_officielle": "C1. Planifier le travail à effectuer individuellement",
        "feature_utilisee": {"nb_js_lines": nb_js_lines},
        "statut_predit": pred,
        "confiance": round(confidence, 2),
        "distribution_proba": {c: round(float(p), 2) for c, p in zip(classes, proba)},
        "limite_connue": "Modèle entraîné sur seulement 17 échantillons — confiance indicative, pas définitive.",
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-dir", required=True)
    args = parser.parse_args()
    result = predict(args.repo_dir)
    print(json.dumps(result, indent=2, ensure_ascii=False))
