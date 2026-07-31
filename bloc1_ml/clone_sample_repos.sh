#!/bin/bash
# Clone les 26 repos réels utilisés pour entraîner le Bloc 1 :
# - 17 repos du brief "Quiz statique (Front-end)"
# - 9 repos du brief "JSQuiz Advanced" (uniquement ceux réellement distincts
#   du Sprint 1 — 8 autres apprenants ont réutilisé le même repo entre les
#   deux briefs et ne sont donc pas dupliqués ici, voir README).
set -e
mkdir -p sample_repos && cd sample_repos

echo "--- Brief 1 : Quiz statique ---"
repos_brief1=(
"meryemlitim/JSQuizStarter"
"Sala7-dine/Quiz_statique"
"fouadlamrini/-JSQuizStarter"
"souadarz/Quiz-statique_JSQuizStarter"
"ElFirdaous28/JSQuizStarter"
"samirakibous/JSQuizStarter"
"Meriemelmm/JSQuizStarter"
"ikrambenallali/JSQuizStarter"
"Ibrahim-Lmlilas/Quiz-statique-"
"AsforDounia/JsQuizStarter"
"LatrachDev/JSQuizStarter"
"Mo7amed-Boukab/JSQuizStarter"
"ayoubjebb2001/JS-Youcode"
"wassim205/JSQuizStarter"
"Nizarberyan/JSQuizStarter"
"Ayoub-fetti/JSQuizStarter"
"Younes-imouga/JSQuizStarter"
)
for r in "${repos_brief1[@]}"; do
  name=$(echo "$r" | tr "/" "_")
  git clone --depth 1 "https://github.com/$r.git" "$name" || echo "ECHEC: $r"
done

echo "--- Brief 2 : JSQuiz Advanced (repos distincts uniquement) ---"
git clone --depth 1 "https://github.com/meryemlitim/JSQuiz-Advanced.git" meryemlitim_JSQuizAdvanced || true
git clone --depth 1 "https://github.com/souadarz/JSQuiz-Advanced.git" souadarz_JSQuizAdvanced || true
git clone --depth 1 "https://github.com/fouadlamrini/JSQuiz-Advanced.git" fouadlamrini_JSQuizAdvanced || true
git clone --depth 1 "https://github.com/Ibrahim-Lmlilas/JSQuiz_Advanced.git" Ibrahim_Lmlilas_JSQuizAdvanced || true
git clone --depth 1 "https://github.com/samirakibous/JSQuiz-Advanced.git" samirakibous_JSQuizAdvanced || true
git clone --depth 1 "https://github.com/ElFirdaous28/JSQuizStarter2.git" ElFirdaous28_JSQuizStarter2 || true
git clone --depth 1 "https://github.com/ayoubjebb2001/JSQuiz-Advanced.git" ayoubjebb2001_JSQuizAdvanced || true
git clone --branch V2 --depth 1 "https://github.com/wassim205/JSQuizStarter.git" wassim205_JSQuizStarter_V2 || true
git clone --branch V2 --depth 1 "https://github.com/Younes-imouga/JSQuizStarter.git" Younes_imouga_JSQuizStarter_V2 || true

echo "Terminé. $(ls -d */ | wc -l) dossiers clonés."
