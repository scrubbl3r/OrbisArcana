function isRecord(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function normalizeManifestEntries(manifestName, entries) {
  const manifest = typeof manifestName === "string" ? manifestName.trim() : "";
  if (!manifest) {
    throw new Error("normalizeManifestEntries requires non-empty manifestName");
  }
  if (!Array.isArray(entries)) {
    throw new Error(`normalizeManifestEntries '${manifest}' entries must be an array`);
  }
  return entries.map((entry, index) => {
    if (!isRecord(entry)) {
      throw new Error(`normalizeManifestEntries '${manifest}' entry[${index}] must be an object`);
    }
    const id = typeof entry.id === "string" ? entry.id.trim() : "";
    const script = typeof entry.script === "string" ? entry.script.trim() : "";
    if (!id) {
      throw new Error(`normalizeManifestEntries '${manifest}' entry[${index}] id must be non-empty`);
    }
    if (!script) {
      throw new Error(`normalizeManifestEntries '${manifest}' entry[${index}] script must be non-empty`);
    }
    return { manifest, id, script };
  });
}

export function findSharedScripts(leftEntries, rightEntries) {
  const toScriptList = (values) =>
    (Array.isArray(values) ? values : [])
      .map((entry) => (typeof entry?.script === "string" ? entry.script.trim() : ""))
      .filter(Boolean);

  const leftScripts = new Set(
    toScriptList(leftEntries)
  );

  const shared = new Set();
  for (const script of toScriptList(rightEntries)) {
    if (leftScripts.has(script)) shared.add(script);
  }

  return [...shared];
}
