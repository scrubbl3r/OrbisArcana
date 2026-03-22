// Stable pretty-JSON formatter used for generated docs/artifacts.
// Single formatter point prevents indentation drift across generated files.
// Two-space indentation is a deliberate project-wide artifact convention.
export function stringifyJson(value) {
  return JSON.stringify(value, null, 2);
}
