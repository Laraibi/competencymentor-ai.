/**
 * Outil "check_code_criteria" de l'agent Bloc 2.
 * Reprend la même logique que l'extraction de features du Bloc 1 (Python),
 * portée en JS pour tourner directement côté backend Node/Express.
 *
 * Objectif : donner à l'agent des signaux OBJECTIFS et vérifiables sur le code,
 * pour qu'il ne base pas son évaluation uniquement sur "l'impression" du LLM,
 * mais sur des critères mesurables (nombre de commentaires, présence de
 * localStorage, structure des fichiers, responsive...).
 *
 * @param {Object} files - map { "index.html": "...", "style.css": "...", "script.js": "..." }
 * @returns {Object} critères mesurés
 */
function checkCodeCriteria(files) {
  const allFileNames = Object.keys(files);
  const jsText = allFileNames.filter(f => f.endsWith(".js")).map(f => files[f]).join("\n");
  const cssText = allFileNames.filter(f => f.endsWith(".css")).map(f => files[f]).join("\n");
  const htmlText = allFileNames.filter(f => f.endsWith(".html") || f.endsWith(".htm")).map(f => files[f]).join("\n");

  const jsLines = jsText.split("\n").filter(l => l.trim().length > 0);
  const nbJsLines = jsLines.length;

  const lineComments = (jsText.match(/\/\/.*/g) || []).length;
  const blockComments = (jsText.match(/\/\*[\s\S]*?\*\//g) || []).length;
  const commentDensity = nbJsLines > 0 ? +((lineComments + blockComments) / nbJsLines).toFixed(3) : 0;

  const usesLocalStorage = jsText.includes("localStorage");
  const usesFetch = jsText.includes("fetch(") || jsText.includes("XMLHttpRequest");
  const nbEventListeners = (jsText.match(/addEventListener/g) || []).length;
  const nbQuerySelectors = (jsText.match(/querySelector/g) || []).length;
  const nbFunctions = (jsText.match(/\bfunction\b|=>/g) || []).length;

  const nbCssRules = (cssText.match(/[^{}]+\{[^{}]*\}/g) || []).length;
  const nbMediaQueries = (cssText.match(/@media/g) || []).length;
  const isResponsive = nbMediaQueries > 0;

  const nbHtmlFiles = allFileNames.filter(f => f.endsWith(".html")).length;
  const nbJsFiles = allFileNames.filter(f => f.endsWith(".js")).length;
  const nbCssFiles = allFileNames.filter(f => f.endsWith(".css")).length;
  const separatedFiles = nbHtmlFiles >= 1 && nbJsFiles >= 1 && nbCssFiles >= 1;

  const bonusKeywords = ["dashboard", "history", "report", "classement", "stats"];
  const hasBonusDashboard = allFileNames.some(f =>
    bonusKeywords.some(kw => f.toLowerCase().includes(kw))
  );
  const hasPdfExport = jsText.toLowerCase().includes("jspdf") || jsText.toLowerCase().includes("pdf");

  // Vérifications directement liées aux "Critères de performance" du brief
  const nbQuestionBlocks = (jsText.match(/question/gi) || []).length; // proxy grossier
  const hasScoreLogic = /score/i.test(jsText);
  const hasTimerLogic = /timer|chronometre|countdown|setInterval/i.test(jsText);
  const hasFeedbackDisplay = /feedback|correct|incorrect|resultat/i.test(jsText) || /feedback|resultat/i.test(htmlText);

  return {
    nb_js_lines: nbJsLines,
    comment_density: commentDensity,
    uses_localstorage: usesLocalStorage,
    uses_fetch: usesFetch,
    nb_event_listeners: nbEventListeners,
    nb_query_selectors: nbQuerySelectors,
    nb_functions: nbFunctions,
    nb_css_rules: nbCssRules,
    nb_media_queries: nbMediaQueries,
    is_responsive: isResponsive,
    separated_files: separatedFiles,
    has_bonus_dashboard: hasBonusDashboard,
    has_pdf_export: hasPdfExport,
    has_score_logic: hasScoreLogic,
    has_timer_logic: hasTimerLogic,
    has_feedback_display: hasFeedbackDisplay,
  };
}

module.exports = { checkCodeCriteria };
