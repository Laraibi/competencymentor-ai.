const LEVEL_CLASS = {
  good: "badge badge-good",
  warn: "badge badge-warn",
  bad: "badge badge-bad",
  neutral: "badge badge-neutral",
};

export function riskToLevel(niveau) {
  if (!niveau) return "neutral";
  if (niveau.startsWith("Élevé")) return "bad";
  if (niveau.startsWith("Modéré")) return "warn";
  if (niveau.startsWith("Faible")) return "good";
  return "neutral";
}

export function statutToLevel(statut) {
  if (!statut) return "neutral";
  const s = statut.toLowerCase();
  if (s.startsWith("valid")) return "good";
  if (s.startsWith("invalid")) return "bad";
  return "neutral";
}

export default function Badge({ level = "neutral", children }) {
  return <span className={LEVEL_CLASS[level] || LEVEL_CLASS.neutral}>{children}</span>;
}
