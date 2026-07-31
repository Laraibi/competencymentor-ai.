import os
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import LeaveOneOut
from sklearn.metrics import accuracy_score, f1_score, classification_report
from sklearn.pipeline import make_pipeline
import joblib

BASE_DIR = os.path.dirname(__file__)
features = pd.read_csv(os.path.join(BASE_DIR, "features.csv"))
labels = pd.read_csv(os.path.join(BASE_DIR, "labels.csv"))
df = features.merge(labels, on="apprenant")

# ============================================================
# MODÈLE C1 (Planification) — dataset élargi à 26 échantillons
# (17 du brief "Quiz statique" + 9 du brief "JSQuiz Advanced", uniquement
# les repos réellement distincts entre les deux briefs — voir README).
#
# Avec ce volume plus large mais plus déséquilibré (17 validées / 9
# invalidées, baseline = 65%), un modèle non pondéré ne bat plus la
# baseline en accuracy. On privilégie donc un modèle PONDÉRÉ
# (class_weight="balanced"), orienté RAPPEL plutôt que précision :
# l'objectif n'est pas de rendre un verdict fiable à 100%, mais de ne
# rater aucun apprenant en difficulté (quitte à générer plus de faux
# positifs, qui seront de toute façon revus par le formateur).
# ============================================================
X = df[["nb_js_lines"]]
y = df["c1_statut"]

loo = LeaveOneOut()
preds, truths = [], []
for train_idx, test_idx in loo.split(X):
    clf = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000, class_weight="balanced"))
    clf.fit(X.iloc[train_idx], y.iloc[train_idx])
    preds.append(clf.predict(X.iloc[test_idx])[0])
    truths.append(y.iloc[test_idx].values[0])

acc = accuracy_score(truths, preds)
f1 = f1_score(truths, preds, average="macro")
baseline_acc = y.value_counts().max() / len(y)

print("=== C1 - Planification (modèle final, N=26, pondéré) ===")
print(f"Distribution des classes : {y.value_counts().to_dict()}")
print(f"Accuracy (LOO) : {acc:.2f} | Baseline (classe majoritaire) : {baseline_acc:.2f}")
print(f"F1-macro : {f1:.2f}")
print()
print(classification_report(truths, preds))
print("Interprétation : modèle orienté RAPPEL (détecter un maximum de cas")
print("à risque), pas précision — outil de triage pour le formateur, pas un verdict.")

# Sauvegarde du modèle final (entraîné sur l'ensemble des 26 échantillons)
final_model = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000, class_weight="balanced"))
final_model.fit(X, y)
joblib.dump(final_model, os.path.join(BASE_DIR, "bloc1_model.joblib"))
print(f"\n✅ Modèle final sauvegardé -> bloc1_model.joblib (feature: nb_js_lines, class_weight=balanced)")
