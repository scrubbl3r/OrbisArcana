function text(v) {
  return String(v || "").trim();
}

export function normalizeManifestEntries(manifestName, entries) {
  return (Array.isArray(entries) ? entries : []).map((entry) => ({
    manifest: manifestName,
    id: text(entry?.id),
    script: text(entry?.script),
  }));
}

export function findSharedScripts(leftEntries, rightEntries) {
  const leftScripts = new Set(
    (Array.isArray(leftEntries) ? leftEntries : [])
      .map((entry) => text(entry?.script))
      .filter(Boolean)
  );

  const shared = new Set();
  for (const entry of Array.isArray(rightEntries) ? rightEntries : []) {
    const script = text(entry?.script);
    if (script && leftScripts.has(script)) shared.add(script);
  }

  return [...shared];
}
