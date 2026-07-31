const fs = require("fs");
const path = require("path");
const { evaluateCompetence } = require("./agent");

// --- Client OpenAI simulé : reproduit un vrai échange multi-tour avec tool calls ---
function makeMockClient() {
  let turn = 0;
  return {
    chat: {
      completions: {
        create: async ({ messages, tools }) => {
          turn += 1;
          if (turn === 1) {
            return {
              choices: [{
                message: {
                  role: "assistant",
                  content: null,
                  tool_calls: [{
                    id: "call_1",
                    type: "function",
                    function: { name: "check_code_criteria", arguments: "{}" },
                  }],
                },
              }],
            };
          }
          if (turn === 2) {
            return {
              choices: [{
                message: {
                  role: "assistant",
                  content: null,
                  tool_calls: [{
                    id: "call_2",
                    type: "function",
                    function: { name: "get_past_evaluations", arguments: "{}" },
                  }],
                },
              }],
            };
          }
          // turn 3 : réponse finale
          const finalJson = {
            competence: "C2. Développer des interfaces utilisateur",
            niveau_estime: "Niveau 1",
            statut: "Validée",
            justification: "Le code présente une séparation claire HTML/CSS/JS, une densité de commentaires correcte et une mise en page responsive (media queries détectées).",
            feedback_apprenant: "Bon travail, ton interface est fonctionnelle et bien structurée. Pense à enrichir le CSS pour aller plus loin sur le rendu visuel.",
          };
          return {
            choices: [{
              message: { role: "assistant", content: JSON.stringify(finalJson) },
            }],
          };
        },
      },
    },
  };
}

async function main() {
  const repoDir = "/home/claude/project/repos/meryemlitim_JSQuizStarter";
  const files = {};
  for (const f of fs.readdirSync(repoDir)) {
    if (f.match(/\.(html|css|js)$/)) {
      files[f] = fs.readFileSync(path.join(repoDir, f), "utf-8");
    }
  }

  const briefCriteria = `
- Quiz fonctionnel (score calculé + feedback affiché)
- Respect du nombre minimum de questions/thématique (>= 10)
- Bonne organisation et séparation du code (HTML/CSS/JS)
- Interface responsive, claire et ergonomique
- Utilisation correcte des concepts de base JS
- Respect des délais (4 jours)`;

  const result = await evaluateCompetence(makeMockClient(), {
    studentName: "Meryem Litim",
    files,
    competenceDescription: "C2. Développer des interfaces utilisateur",
    briefCriteria,
  });

  console.log("=== Résultat final de l'agent (client simulé) ===");
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
