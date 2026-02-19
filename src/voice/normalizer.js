const NON_ALNUM_RE = /[^a-z0-9\s]/g;
const MULTISPACE_RE = /\s+/g;

// Conservative canonicalization focused on closed-vocab spell matching.
const PHONETIC_SUBS = Object.freeze([
  ["ph", "f"],
  ["ck", "k"],
  ["qu", "kw"],
  ["x", "ks"],
]);

export function normalizeTranscript(input) {
  const raw = String(input == null ? "" : input)
    .normalize("NFKD")
    .toLowerCase()
    .replace(NON_ALNUM_RE, " ")
    .replace(MULTISPACE_RE, " ")
    .trim();

  if (!raw) return "";

  let canonical = raw;
  for (const [from, to] of PHONETIC_SUBS) {
    canonical = canonical.split(from).join(to);
  }
  canonical = canonical.replace(MULTISPACE_RE, " ").trim();
  return canonical;
}

export function splitWords(input) {
  const n = normalizeTranscript(input);
  return n ? n.split(" ") : [];
}

export function stripWakeTokenPrefix(text, wakeToken) {
  const transcript = normalizeTranscript(text);
  const wake = normalizeTranscript(wakeToken);
  if (!transcript || !wake) return { hasWake: false, rest: transcript };
  if (transcript === wake) return { hasWake: true, rest: "" };
  if (transcript.startsWith(wake + " ")) {
    return { hasWake: true, rest: transcript.slice(wake.length + 1).trim() };
  }
  return { hasWake: false, rest: transcript };
}
