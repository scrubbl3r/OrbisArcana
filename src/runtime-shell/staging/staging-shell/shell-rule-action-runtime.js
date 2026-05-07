export function bindShellRuleActionRuntime({
  eventBus,
  ruleSchema = null,
  executeWordCastAction = () => ({ handled: false }),
  kwsBridge = null,
} = {}) {
  if (!eventBus || typeof eventBus.on !== "function") {
    return { dispose() {} };
  }
  const bindings = (ruleSchema && ruleSchema.eventRuntimeBindings && typeof ruleSchema.eventRuntimeBindings === "object")
    ? ruleSchema.eventRuntimeBindings
    : Object.create(null);
  const off = eventBus.on("rule_engine.action_executed", (p = {}) => {
    const actionType = String(p.actionType || "").trim().toLowerCase();
    const actionId = String(p.actionId || "").trim().toLowerCase();
    if (actionType !== "event") return;
    const binding = bindings[actionId] || null;
    const runtime = binding && binding.runtime && typeof binding.runtime === "object"
      ? binding.runtime
      : null;
    const kind = String(runtime && runtime.kind || "").trim().toLowerCase();
    if (kind !== "cast_action") return;
    const castActionId = String(runtime && runtime.castActionId || "").trim().toLowerCase();
    if (!castActionId) return;
    const result = executeWordCastAction(castActionId, {
      intent: "rule_engine.event",
      payload: {
        trigger: "rule_engine",
        actionId,
        ruleId: String(p.ruleId || ""),
        atMs: Number(p.atMs) || performance.now(),
        ...(p && typeof p.args === "object" ? p.args : {}),
      },
    });
    if (kwsBridge && typeof kwsBridge.pushLogLine === "function") {
      kwsBridge.pushLogLine(`TRACE exec:${castActionId}:${result && result.handled ? "ok" : "miss"}`, result && result.handled ? "ok" : "warn");
    }
  });
  return {
    dispose() {
      try { off(); } catch (_) {}
    },
  };
}
