export function normalizeManifestEntries(manifestName, entries) {
  return (Array.isArray(entries) ? entries : []).map((entry) => ({
    manifest: manifestName,
    id: String(entry?.id || "").trim(),
    script: String(entry?.script || "").trim(),
  }));
}

export function findSharedScripts(leftEntries, rightEntries) {
  const leftScripts = new Set(
    (Array.isArray(leftEntries) ? leftEntries : [])
      .map((entry) => String(entry?.script || "").trim())
      .filter(Boolean)
  );

  const shared = new Set();
  for (const entry of Array.isArray(rightEntries) ? rightEntries : []) {
    const script = String(entry?.script || "").trim();
    if (script && leftScripts.has(script)) shared.add(script);
  }

  return [...shared];
}
