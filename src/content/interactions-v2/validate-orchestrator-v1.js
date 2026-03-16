export function validateOrchestratorV1(cfg) {
  const errors = [];
  const target = cfg || {};
  if (target && typeof target !== "object") {
    errors.push("ORCHESTRATOR_V1 must be an object");
    return errors;
  }
  if (Object.prototype.hasOwnProperty.call(target, "rules") && !Array.isArray(target.rules)) {
    errors.push("ORCHESTRATOR_V1.rules must be an array");
  }
  return errors;
}
