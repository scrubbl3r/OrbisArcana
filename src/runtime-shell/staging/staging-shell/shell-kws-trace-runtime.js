export function bindShellKwsTraceRuntime({
  eventBus = null,
  kwsPanelController = null,
  kwsBridge = null,
} = {}) {
  if (!eventBus || typeof eventBus.on !== "function") {
    return {
      kwsListenPolicySyncOff: () => {},
      kwsRuleTraceOff: () => {},
      kwsActionTraceOff: () => {},
    };
  }

  const kwsListenPolicySyncOff = eventBus.on("voice.kws_listen_policy_changed", (payload = {}) => {
    const tokens = Array.isArray(payload.listenableTokens) ? payload.listenableTokens : [];
    if (kwsPanelController && typeof kwsPanelController.setManualListenableTokens === "function") {
      kwsPanelController.setManualListenableTokens(tokens);
    }
    if (kwsPanelController && typeof kwsPanelController.refreshPathBoard === "function") {
      kwsPanelController.refreshPathBoard();
    }
    if (kwsBridge && typeof kwsBridge.pushLogLine === "function") {
      kwsBridge.pushLogLine(
        `TRACE tree.policy tokens:${tokens.length ? tokens.join(",") : "-"}`,
        "muted"
      );
    }
  });

  const kwsRuleTraceOff = eventBus.on("rule_engine.preview_matched", (payload = {}) => {
    const ruleId = String(payload.ruleId || "").trim().toLowerCase();
    if (!ruleId || !kwsBridge || typeof kwsBridge.pushLogLine !== "function") return;
    kwsBridge.pushLogLine(`TRACE matched:${ruleId}`, "ok");
  });

  const kwsActionTraceOff = eventBus.on("rule_engine.action_executed", (payload = {}) => {
    const actionType = String(payload.actionType || "").trim().toLowerCase();
    const actionId = String(payload.actionId || "").trim().toLowerCase();
    if (!kwsBridge || typeof kwsBridge.pushLogLine !== "function") return;
    kwsBridge.pushLogLine(`TRACE action:${actionType}:${actionId}`, "ok");
  });

  return {
    kwsListenPolicySyncOff,
    kwsRuleTraceOff,
    kwsActionTraceOff,
  };
}
