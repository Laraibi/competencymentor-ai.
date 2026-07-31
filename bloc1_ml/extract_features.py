import os
import re
import csv
import json

REPOS_DIR = "/home/claude/project/repos"

# mapping folder -> apprenant (ordre confirmé identique aux deux tableaux)
FOLDER_TO_STUDENT = {
    "meryemlitim_JSQuizStarter": "Meryem Litim",
    "Sala7-dine_Quiz_statique": "Salahdine Daha",
    "fouadlamrini_-JSQuizStarter": "Fouad Lamrini",
    "souadarz_Quiz-statique_JSQuizStarter": "Souad Arziki",
    "ElFirdaous28_JSQuizStarter": "Firdaous El Mokhtari",
    "samirakibous_JSQuizStarter": "Samira Kibous",
    "Meriemelmm_JSQuizStarter": "Meriem El Mecaniqui",
    "ikrambenallali_JSQuizStarter": "Ikram Elbenallali",
    "Ibrahim-Lmlilas_Quiz-statique-": "Ibrahim Lmlilas",
    "AsforDounia_JsQuizStarter": "Dounia Asfor",
    "LatrachDev_JSQuizStarter": "Mohammed Latrach",
    "Mo7amed-Boukab_JSQuizStarter": "Mohamed Boukab",
    "ayoubjebb2001_JS-Youcode": "Ayoub Jebbouri",
    "wassim205_JSQuizStarter": "Wassim El Mourabit",
    "Nizarberyan_JSQuizStarter": "Nizar Beriane",
    "Ayoub-fetti_JSQuizStarter": "Ayoub Fetti",
    "Younes-imouga_JSQuizStarter": "Younes Imouga",
}

def read_files(root, exts):
    out = []
    for dirpath, dirnames, filenames in os.walk(root):
        if ".git" in dirpath:
            continue
        for f in filenames:
            if f.lower().endswith(exts):
                path = os.path.join(dirpath, f)
                try:
                    with open(path, "r", encoding="utf-8", errors="ignore") as fh:
                        out.append((path, fh.read()))
                except Exception:
                    pass
    return out

def extract(folder):
    root = os.path.join(REPOS_DIR, folder)
    js_files = read_files(root, (".js",))
    css_files = read_files(root, (".css",))
    html_files = read_files(root, (".html", ".htm"))
    readme_files = [c for p, c in read_files(root, (".md",)) if "readme" in os.path.basename(p).lower()]

    js_text = "\n".join(c for _, c in js_files)
    css_text = "\n".join(c for _, c in css_files)
    html_text = "\n".join(c for _, c in html_files)
    readme_text = "\n".join(readme_files)

    js_lines = [l for l in js_text.splitlines() if l.strip()]
    nb_js_lines = len(js_lines)

    # comment density (line + block comments)
    nb_line_comments = len(re.findall(r'//.*', js_text))
    nb_block_comments = len(re.findall(r'/\*[\s\S]*?\*/', js_text))
    comment_density = round((nb_line_comments + nb_block_comments) / max(nb_js_lines, 1), 3)

    nb_functions = len(re.findall(r'\bfunction\b|\=\>', js_text))
    nb_addEventListener = len(js_text.count("addEventListener") for _ in [0]) if False else js_text.count("addEventListener")
    nb_queryselector = js_text.count("querySelector")
    uses_localstorage = 1 if "localStorage" in js_text else 0
    uses_fetch = 1 if ("fetch(" in js_text or "XMLHttpRequest" in js_text) else 0

    nb_css_rules = len(re.findall(r'[^{}]+\{[^{}]*\}', css_text))
    nb_media_queries = len(re.findall(r'@media', css_text))
    nb_css_colors = len(set(re.findall(r'#[0-9a-fA-F]{3,6}', css_text)))
    nb_css_lines = len([l for l in css_text.splitlines() if l.strip()])

    nb_html_files = len(html_files)
    nb_js_files = len(js_files)
    nb_css_files = len(css_files)
    separated_files = 1 if (nb_html_files >= 1 and nb_js_files >= 1 and nb_css_files >= 1) else 0

    has_dashboard_or_bonus = 1 if any(
        kw in os.path.basename(p).lower()
        for p, _ in html_files + js_files
        for kw in ["dashboard", "history", "report", "classement", "stats"]
    ) else 0
    has_pdf_export = 1 if ("jspdf" in js_text.lower() or "pdf" in js_text.lower()) else 0

    has_readme = 1 if readme_text.strip() else 0
    readme_len = len(readme_text)
    readme_mentions_planning = 1 if re.search(r'trello|planning|planifi|organisation|kanban', readme_text, re.IGNORECASE) else 0

    return {
        "folder": folder,
        "apprenant": FOLDER_TO_STUDENT.get(folder, "?"),
        "nb_js_lines": nb_js_lines,
        "comment_density": comment_density,
        "nb_functions": nb_functions,
        "nb_addEventListener": nb_addEventListener,
        "nb_queryselector": nb_queryselector,
        "uses_localstorage": uses_localstorage,
        "uses_fetch": uses_fetch,
        "nb_css_rules": nb_css_rules,
        "nb_media_queries": nb_media_queries,
        "nb_css_colors": nb_css_colors,
        "nb_css_lines": nb_css_lines,
        "nb_html_files": nb_html_files,
        "nb_js_files": nb_js_files,
        "nb_css_files": nb_css_files,
        "separated_files": separated_files,
        "has_dashboard_or_bonus": has_dashboard_or_bonus,
        "has_pdf_export": has_pdf_export,
        "has_readme": has_readme,
        "readme_len": readme_len,
        "readme_mentions_planning": readme_mentions_planning,
    }

rows = []
for folder in sorted(os.listdir(REPOS_DIR)):
    full = os.path.join(REPOS_DIR, folder)
    if os.path.isdir(full) and not folder.startswith("."):
        rows.append(extract(folder))

out_path = "/home/claude/project/features.csv"
fieldnames = list(rows[0].keys())
with open(out_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print(f"Extracted {len(rows)} rows -> {out_path}")
for r in rows:
    print(r["apprenant"], "|", r["folder"])
