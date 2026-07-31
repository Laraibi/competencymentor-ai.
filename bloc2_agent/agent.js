const { checkCodeCriteria } = require("./staticChecks");
const { getPastEvaluations, addEvaluation } = require("./memoryStore");
const { SYSTEM_PROMPT, FEW_SHOT_STYLE_EXAMPLES } = require("./prompts");

const TOOLS = [
  {
    type: "function",
    function: {
      name: "check_code_criteria",
      description: "Analyse statique du code source de l'apprenant : commentaires, structure, CSS, fonctionnalités détectées (localStorage, timer, score, responsive...).",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_past_evaluations",
      description: "Récupère l'historique des évaluations précédentes de cet apprenant, toutes compétences confondues.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
];

/**
 * Évalue une compétence pour un apprenant donné à partir de son code.
 *
 * @param {Object} openaiClient - instance du client OpenAI (injectée, pour faciliter les tests)
 * @param {Object} params
 * @param {string} params.studentName
 * @param {Object} params.files - { "index.html": "...", "style.css": "...", "script.js": "..." }
 * @param {string} params.competenceDescription - texte de la compétence à évaluer
 *        (peut être une compétence connue du référentiel OU une compétence
 *        toute nouvelle créée par un formateur : le mécanisme est identique -> cold start géré nativement)
 * @param {string} params.briefCriteria - texte des critères de performance du brief
 * @param {string} [params.model="gpt-4o-mini"]
 */
async function evaluateCompetence(openaiClient, { studentName, files, competenceDescription, briefCriteria, bloc1Prediction = null, model = "gpt-4o-mini" }) {
  const bloc1Context = bloc1Prediction
    ? `Prédiction du modèle ML (Bloc 1) pour cet apprenant :\n${JSON.stringify(bloc1Prediction, null, 2)}\n(Ce score est un signal statistique, pas une vérité absolue — tu dois le confronter aux critères réels du code via l'outil check_code_criteria avant de conclure.)`
    : `Aucune prédiction du Bloc 1 disponible pour cette compétence (cas "cold start" : compétence nouvelle, jamais entraînée). Base ton évaluation uniquement sur le raisonnement et les outils.`;

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: [
        `Apprenant : ${studentName}`,
        `Compétence à évaluer : ${competenceDescription}`,
        `Critères de performance du brief :\n${briefCriteria}`,
        bloc1Context,
        `Exemples de ton attendu pour le feedback (ne pas copier, juste s'inspirer du style) :`,
        JSON.stringify(FEW_SHOT_STYLE_EXAMPLES, null, 2),
        `Utilise les outils disponibles avant de rendre ton évaluation finale.`,
      ].join("\n\n"),
    },
  ];

  let finalResult = null;
  const maxTurns = 4;

  for (let turn = 0; turn < maxTurns; turn++) {
    const response = await openaiClient.chat.completions.create({
      model,
      messages,
      tools: TOOLS,
      tool_choice: "auto",
      response_format: { type: "json_object" },
    });

    const choice = response.choices[0];
    const msg = choice.message;
    messages.push(msg);

    if (msg.tool_calls && msg.tool_calls.length > 0) {
      for (const call of msg.tool_calls) {
        let result;
        if (call.function.name === "check_code_criteria") {
          result = checkCodeCriteria(files);
        } else if (call.function.name === "get_past_evaluations") {
          result = getPastEvaluations(studentName);
        } else {
          result = { error: "unknown tool" };
        }
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
      continue; // reboucle pour laisser le modèle exploiter les résultats des outils
    }

    // pas de tool call -> le modèle a répondu, on tente de parser le JSON final
    try {
      finalResult = JSON.parse(msg.content);
    } catch (e) {
      // Filet de sécurité : JSON malformé malgré le mode strict -> on redemande une correction
      messages.push({
        role: "user",
        content: "Le JSON précédent était invalide (erreur de syntaxe). Renvoie EXACTEMENT le même contenu, mais en JSON strictement valide (vérifie les virgules entre les champs).",
      });
      try {
        const repair = await openaiClient.chat.completions.create({
          model,
          messages,
          response_format: { type: "json_object" },
        });
        finalResult = JSON.parse(repair.choices[0].message.content);
      } catch (e2) {
        finalResult = { raw: msg.content, parse_error: true };
      }
    }
    break;
  }

  if (finalResult && !finalResult.parse_error) {
    addEvaluation(studentName, finalResult);
  }

  return finalResult;
}

module.exports = { evaluateCompetence, TOOLS };
