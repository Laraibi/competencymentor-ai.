/**
 * Parse un textarea "multi-fichiers" utilisant des marqueurs de nom de fichier :
 *   ### index.html
 *   <contenu...>
 *   ### script.js
 *   <contenu...>
 * Si aucun marqueur n'est trouvé, tout le texte est traité comme un seul fichier script.js.
 */
export function parseFilesText(text) {
  const markerRegex = /^###\s*(.+)$/gm;
  const matches = [...text.matchAll(markerRegex)];

  if (matches.length === 0) {
    return text.trim() ? { "script.js": text } : {};
  }

  const files = {};
  matches.forEach((match, i) => {
    const filename = match[1].trim();
    const start = match.index + match[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    files[filename] = text.slice(start, end).trim();
  });
  return files;
}

export const EXAMPLE_TEMPLATE = `### index.html
<!DOCTYPE html>
<html>
<head><title>Quiz</title></head>
<body>
  <div id="app"></div>
  <script src="script.js"></script>
</body>
</html>

### style.css
body { font-family: sans-serif; }

### script.js
document.addEventListener("DOMContentLoaded", () => {
  console.log("quiz ready");
});
`;
