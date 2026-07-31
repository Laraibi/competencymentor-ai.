import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import LeaveOneOut
from sklearn.metrics import accuracy_score, f1_score
from sklearn.dummy import DummyClassifier
from sklearn.pipeline import make_pipeline

features = pd.read_csv("/home/claude/project/features.csv")
labels = pd.read_csv("/home/claude/project/labels.csv")

df = features.merge(labels, on="apprenant")

# feature set réduit : uniquement les variables montrant un écart réel entre classes,
# pour éviter le sur-apprentissage avec seulement 17 échantillons
feature_cols = [
    "nb_js_lines", "readme_len", "nb_functions", "comment_density", "nb_media_queries",
]

X = df[feature_cols].fillna(0)

def evaluate_target(target_col, label_name):
    y = df[target_col]
    loo = LeaveOneOut()
    preds, baseline_preds, truths = [], [], []
    for train_idx, test_idx in loo.split(X):
        X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
        y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

        clf = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000, C=0.5))
        clf.fit(X_train, y_train)
        pred = clf.predict(X_test)[0]

        baseline = DummyClassifier(strategy="most_frequent")
        baseline.fit(X_train, y_train)
        base_pred = baseline.predict(X_test)[0]

        preds.append(pred)
        baseline_preds.append(base_pred)
        truths.append(y_test.values[0])

    acc = accuracy_score(truths, preds)
    f1 = f1_score(truths, preds, average="macro")
    base_acc = accuracy_score(truths, baseline_preds)

    print(f"\n=== {label_name} ===")
    print(f"Distribution des classes : {y.value_counts().to_dict()}")
    print(f"Modèle RandomForest -> Accuracy (LOO): {acc:.2f} | F1-macro: {f1:.2f}")
    print(f"Baseline (classe majoritaire)   -> Accuracy (LOO): {base_acc:.2f}")
    print("Détail (réel vs prédit) :")
    for name, t, p in zip(df["apprenant"], truths, preds):
        marker = "OK" if t == p else "X "
        print(f"  [{marker}] {name:<25} réel={t:<10} prédit={p}")

    # coefficients on full data fit (standardized, donc comparables)
    clf_full = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000, C=0.5))
    clf_full.fit(X, y)
    coefs = clf_full.named_steps["logisticregression"].coef_[0]
    importances = sorted(zip(feature_cols, coefs), key=lambda x: -abs(x[1]))
    print("Coefficients (standardisés) :", [f"{f} ({c:+.2f})" for f, c in importances])

evaluate_target("c1_statut", "C1 - Planification (officiel formateur)")
evaluate_target("css_quality", "Qualité CSS/UI (dérivée du feedback texte)")
