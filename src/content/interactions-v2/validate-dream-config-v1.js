export function validateDreamConfigV1(cfg) {
  const errors = [];
  const target = cfg || {};
  if (target && typeof target !== "object") {
    errors.push("DREAM_CONFIG_V1 must be an object");
    return errors;
  }
  if (Object.prototype.hasOwnProperty.call(target, "rules") && !Array.isArray(target.rules)) {
    errors.push("DREAM_CONFIG_V1.rules must be an array");
  }
  return errors;
}
