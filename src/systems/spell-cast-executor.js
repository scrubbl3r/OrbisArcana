export function createSpellCastExecutor({
  castActionRegistryById,
  handlers,
  grantFloatGrace,
  floatGraceDefaultMs = 1000,
  floatGraceDomusMs = 5000,
} = {}){
  const registry = castActionRegistryById || Object.create(null);
  const handlerMap = handlers || Object.create(null);

  function execute(castActionId, context = {}){
    const actionId = String(castActionId || "").toLowerCase();
    const p = (context && context.payload) || {};
    const meta = registry[actionId] || null;
    const handlerKey = String(meta && meta.handlerKey || "");
    const floatGracePolicy = String(meta && meta.floatGracePolicy || "default");
    const handler = handlerMap[handlerKey];
    let handled = false;
    let grantGrace = true;
    let floatGraceMs = Number(p && p.floatGraceMs);

    if (typeof handler === "function") {
      handler(p);
      handled = true;
    }

    if (floatGracePolicy === "none") {
      grantGrace = false;
    } else if (floatGracePolicy === "domus") {
      floatGraceMs = Number(floatGraceDomusMs);
    }

    if (grantGrace && typeof grantFloatGrace === "function") {
      if (!Number.isFinite(floatGraceMs)) floatGraceMs = Number(floatGraceDefaultMs);
      grantFloatGrace(floatGraceMs);
    }

    return { handled, grantGrace, floatGraceMs };
  }

  return { execute };
}

