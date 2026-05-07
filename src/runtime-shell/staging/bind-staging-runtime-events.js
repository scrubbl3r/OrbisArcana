export function bindStagingRuntimeEvents({
  eventBus,
  RECEIVER_EVENTS,
  RULE_ENGINE_ACTION_EXECUTED_EVENT,
  RULE_ENGINE_PREVIEW_MATCHED_EVENT,
  RULE_ENGINE_WAKE_WIN_OPENED_EVENT,
  RULE_ENGINE_SOURCE_EVENT_SUMMARY_EVENT,
  RULE_ENGINE_TRIGGER,
  RULE_CHAIN_TRACE_ENABLED = false,
  DEFAULT_KWS_GATE_TIMEOUT_MS = 1500,
  kwsBridge = null,
  kwsListenPolicyController = null,
  kwsRuntimeController = null,
  kwsPanelController = null,
  kwsTokenUiState = null,
  TEMP_UNGATED_KWS_TOKENS = new Set(),
  kwsDebugState = {},
  ruleSchema = null,
  runtimeWordIndex = {},
  runtimeSpellIndex = {},
  castActionForWordId = () => "",
  executeWordCastAction = () => ({ handled: false }),
  playElectricAoe = () => {},
  playOrbNod = () => {},
  clearFloatGrace = () => {},
  renderLegacyDomOrbDamageVisuals = () => {},
  spawnShardFx = () => {},
  clearOrbRuntimeFxForDeath = () => {},
  scheduleDeathOverlay = () => {},
  updateDebugReadout = () => {},
  legacyDomOrbShatterController = null,
  stopShardSim = () => {},
  worldSystem = null,
  resetOrbStrokeColor = () => {},
  clearDeathOverlaySchedule = () => {},
  closeDeathOverlay = () => {},
  setOrbInputSuppressed = () => {},
  getOrbAlive = () => true,
  skipVoiceSpellCastBinding = false,
  perfTrace = null,
} = {}) {
  let lastHeardNodToken = "";
  let lastHeardNodAtMs = 0;

  function markPerf(name, value = {}) {
    if (!perfTrace || typeof perfTrace.mark !== "function") return;
    perfTrace.mark(name, value && typeof value === "object" ? value : {});
  }

  function shouldTriggerHeardWordNod(token, atMs) {
    const heardToken = String(token || "").trim().toLowerCase();
    const heardAtMs = Number.isFinite(Number(atMs)) ? Number(atMs) : performance.now();
    if (!heardToken || !getOrbAlive()) return false;
    if (heardToken === lastHeardNodToken && (heardAtMs - lastHeardNodAtMs) < 120) {
      return false;
    }
    lastHeardNodToken = heardToken;
    lastHeardNodAtMs = heardAtMs;
    return true;
  }

  eventBus.on(RECEIVER_EVENTS.EVT_ORB_VISUAL_STATE_CHANGED, renderLegacyDomOrbDamageVisuals);
  eventBus.on(RECEIVER_EVENTS.EVT_ORB_SHATTER_PIECE_SPAWNED, spawnShardFx);
  eventBus.on(RECEIVER_EVENTS.EVT_ORB_DIED, () => {
    if (
      legacyDomOrbShatterController &&
      typeof legacyDomOrbShatterController.handleOrbDied === "function"
    ) {
      legacyDomOrbShatterController.handleOrbDied();
    }
    setOrbInputSuppressed(true);
    clearFloatGrace();
    clearOrbRuntimeFxForDeath();
    scheduleDeathOverlay();
    updateDebugReadout();
  });
  eventBus.on(RECEIVER_EVENTS.EVT_ORB_REVIVED, () => {
    if (
      legacyDomOrbShatterController &&
      typeof legacyDomOrbShatterController.handleOrbRevived === "function"
    ) {
      legacyDomOrbShatterController.handleOrbRevived();
    }
    setOrbInputSuppressed(false);
    clearFloatGrace();
    clearDeathOverlaySchedule();
    closeDeathOverlay();
    if (worldSystem) worldSystem.reset(performance.now());
    resetOrbStrokeColor(true);
    renderLegacyDomOrbDamageVisuals();
    updateDebugReadout();
  });
  eventBus.on(RECEIVER_EVENTS.EVT_VOICE_TOKEN_DETECTED, (p = {}) => {
    const token = String(p.token || "").trim().toLowerCase();
    const atMs = Number.isFinite(Number(p.atMs)) ? Number(p.atMs) : performance.now();
    if (!shouldTriggerHeardWordNod(token, atMs)) return;
    playOrbNod({
      token,
      phrase: token,
      confidence: Number(p.confidence),
      atMs,
      source: String(p.source || "kws"),
      providerId: String(p.providerId || ""),
    });
  });
  eventBus.on(RECEIVER_EVENTS.EVT_ORB_SHATTER_COMPLETE, () => {
    if (
      legacyDomOrbShatterController &&
      typeof legacyDomOrbShatterController.handleOrbShatterComplete === "function"
    ) {
      legacyDomOrbShatterController.handleOrbShatterComplete();
    } else {
      stopShardSim();
    }
  });
  if (!skipVoiceSpellCastBinding) {
    eventBus.on(RECEIVER_EVENTS.EVT_VOICE_SPELL_CAST, (p = {}) => {
      const intent = String(p.intent || "");
      const wordId = String((p.sourceWordId || p.wordId || p.spellId) || "").toLowerCase();
      const payloadCastActionId = String(p.castActionId || "").trim().toLowerCase();
      const wordDef = runtimeWordIndex[wordId] || runtimeSpellIndex[wordId] || null;
      const castActionId = payloadCastActionId || (wordDef ? String(wordDef.castActionId || "") : castActionForWordId(wordId));
      const result = executeWordCastAction(castActionId, { payload: p, intent });
      if (RULE_CHAIN_TRACE_ENABLED && kwsBridge && typeof kwsBridge.pushLogLine === "function" && castActionId === "aoe_flame") {
        kwsBridge.pushLogLine(
          `TRACE voice_cast:aoe_flame:word:${wordId || "-"}:trigger:${String(p.trigger || "-").trim().toLowerCase() || "-"}:${result && result.handled ? "ok" : "miss"}`,
          result && result.handled ? "ok" : "warn"
        );
      }
      if (result && result.handled && wordDef) {
        const postCastActions = Array.isArray(wordDef.postCastActions) ? wordDef.postCastActions : null;
        if (postCastActions) {
          for (const action of postCastActions) {
            const actionId = String(action && action.id || "");
            if (!actionId) continue;
            const payload = (action && typeof action.payload === "object" && action.payload)
              ? { ...p, ...action.payload }
              : p;
            executeWordCastAction(actionId, { payload, intent });
          }
        } else if (Array.isArray(wordDef.postCastActionIds)) {
          for (const actionId of wordDef.postCastActionIds) {
            executeWordCastAction(String(actionId || ""), { payload: p, intent });
          }
        }
      }
    });
  }
  let lastRuleEngineActionKey = "";
  let lastRuleEngineActionAtMs = 0;
  eventBus.on(RULE_ENGINE_ACTION_EXECUTED_EVENT, (p = {}) => {
    const actionType = String(p.actionType || "").toLowerCase();
    const actionId = String(p.actionId || "").toLowerCase();
    const dedupeAtMsRaw = Number(p.atMs);
    const dedupeAtMs = Number.isFinite(dedupeAtMsRaw) ? Math.floor(dedupeAtMsRaw) : 0;
    const dedupeKey = `${String(p.ruleId || "")}|${actionType}|${actionId}|${dedupeAtMs}`;
    const nowMs = performance.now();
    if (dedupeKey && dedupeKey === lastRuleEngineActionKey && (nowMs - lastRuleEngineActionAtMs) < 100) return;
    lastRuleEngineActionKey = dedupeKey;
    lastRuleEngineActionAtMs = nowMs;
    if (actionType === "wake_win") {
      const args = (p && typeof p.args === "object" && p.args) ? p.args : {};
      const ttlMs = Math.max(0, Number(args.ttlMs) || DEFAULT_KWS_GATE_TIMEOUT_MS);
      void ttlMs;
      eventBus.emit(RECEIVER_EVENTS.EVT_VOICE_SET_MODE, { mode: "wake_token_open_world" });
      return;
    }
    if (actionType === "bind") {
      const args = (p && typeof p.args === "object" && p.args) ? p.args : {};
      const slot = String(args.slot || actionId || "").trim().toUpperCase();
      const spell = String(args.spell || "").trim().toLowerCase();
      if (!slot || !spell) return;
      eventBus.emit("spell.slot_load_requested", {
        trigger: RULE_ENGINE_TRIGGER,
        ruleId: String(p.ruleId || ""),
        actionId,
        atMs: Number(p.atMs) || performance.now(),
        ...args,
        slot,
        spell,
      });
      if (RULE_CHAIN_TRACE_ENABLED && kwsBridge && typeof kwsBridge.pushLogLine === "function") {
        kwsBridge.pushLogLine(`TRACE exec:bind:${slot.toLowerCase()}:${spell}`, "ok");
      }
      return;
    }
    if (actionType !== "event") return;
    const args = (p && typeof p.args === "object" && p.args) ? p.args : {};
    if (actionId === "aoe_electric") {
      playElectricAoe();
      if (RULE_CHAIN_TRACE_ENABLED && kwsBridge && typeof kwsBridge.pushLogLine === "function") {
        kwsBridge.pushLogLine("TRACE exec:aoe_electric:direct", "ok");
      }
      return;
    }
    const bindings = (ruleSchema && ruleSchema.eventRuntimeBindings && typeof ruleSchema.eventRuntimeBindings === "object")
      ? ruleSchema.eventRuntimeBindings
      : Object.create(null);
    const binding = bindings[actionId] || null;
    const runtime = binding && binding.runtime && typeof binding.runtime === "object"
      ? binding.runtime
      : null;
    const kind = String(runtime && runtime.kind || "").toLowerCase();
    if (kind === "cast_action") {
      const castActionId = String(runtime && runtime.castActionId || "");
      if (!castActionId) return;
      if (castActionId === "cast_loaded_ud" || castActionId === "cast_loaded_lr" || castActionId === "cast_loaded_fb") {
        const slot = castActionId === "cast_loaded_ud"
          ? "UD"
          : castActionId === "cast_loaded_lr"
          ? "LR"
          : "FB";
        eventBus.emit("spell.slot_cast_requested", {
          trigger: "rule_engine_loaded_slot",
          ruleId: String(p.ruleId || ""),
          actionId,
          atMs: Number(p.atMs) || performance.now(),
          slot,
          directionGroup: slot,
          ...args,
        });
        if (RULE_CHAIN_TRACE_ENABLED && kwsBridge && typeof kwsBridge.pushLogLine === "function") {
          kwsBridge.pushLogLine(`TRACE exec:${actionId}:cast:ok`, "ok");
        }
        return;
      }
      const execResult = executeWordCastAction(castActionId, {
        intent: "rule_engine.event",
        payload: {
          trigger: RULE_ENGINE_TRIGGER,
          actionId,
          ruleId: String(p.ruleId || ""),
          atMs: Number(p.atMs) || performance.now(),
          ...args,
        },
      });
      if (RULE_CHAIN_TRACE_ENABLED && kwsBridge && typeof kwsBridge.pushLogLine === "function" && (
        actionId === "cast_loaded_ud" || actionId === "cast_loaded_lr" || actionId === "cast_loaded_fb"
      )) {
        const handled = !!(execResult && execResult.handled);
        kwsBridge.pushLogLine(`TRACE exec:${actionId}:cast:${handled ? "ok" : "miss"}`, handled ? "ok" : "warn");
      }
      if (RULE_CHAIN_TRACE_ENABLED && kwsBridge && typeof kwsBridge.pushLogLine === "function" && (
        actionId === "teleport" || actionId === "aoe_electric" || actionId === "aoe_flame" || actionId === "shockwave"
      )) {
        const handled = !!(execResult && execResult.handled);
        kwsBridge.pushLogLine(`TRACE exec:${actionId}:cast:${handled ? "ok" : "miss"}`, handled ? "ok" : "warn");
      }
      return;
    }
    if (kind === "orb_event") {
      const eventId = String(runtime && runtime.event || "");
      if (!eventId) return;
      eventBus.emit(eventId, {
        trigger: RULE_ENGINE_TRIGGER,
        actionId,
        ruleId: String(p.ruleId || ""),
        atMs: Number(p.atMs) || performance.now(),
        ...args,
      });
    }
  });

  if (!RULE_CHAIN_TRACE_ENABLED) return;

  const getListenPolicyTraceState = () => {
    const status = (kwsListenPolicyController && typeof kwsListenPolicyController.getStatus === "function")
      ? kwsListenPolicyController.getStatus()
      : null;
    const mode = String(status && status.mode || "B").trim().toUpperCase() || "B";
    const tokens = new Set(
      (Array.isArray(status && status.listenableTokens) ? status.listenableTokens : [])
        .map((token) => String(token || "").trim().toLowerCase())
        .filter(Boolean)
    );
    return { mode, tokens };
  };

  eventBus.on("input.shake_triggered", (p = {}) => {
    const group = String(p.group || "").trim().toUpperCase();
    const code = String(p.code || "").trim().toUpperCase();
    kwsBridge.pushLogLine(`TRACE shake:code:${code || "-"} group:${group || "-"}`, group ? "muted" : "warn");
  });
  eventBus.on("spell.slot_load_requested", (p = {}) => {
    const slot = String(p.slot || "").trim().toUpperCase();
    const spell = String((p.spell || p.wordId || p.spellId) || "").trim().toLowerCase();
    kwsBridge.pushLogLine(`TRACE slot_load_req:${slot || "-"}:${spell || "-"}`, slot && spell ? "ok" : "warn");
  });
  eventBus.on("voice.spell_loaded", (p = {}) => {
    const slot = String(p.slot || "").trim().toUpperCase();
    const spell = String((p.castActionId || p.sourceWordId || p.wordId || p.spellId) || "").trim().toLowerCase();
    kwsBridge.pushLogLine(`TRACE slot_loaded:${slot || "-"}:${spell || "-"}`, slot && spell ? "ok" : "warn");
  });
  eventBus.on("spell.slot_cast_requested", (p = {}) => {
    const slot = String(p.slot || "").trim().toUpperCase();
    kwsBridge.pushLogLine(`TRACE slot_cast_req:${slot || "-"}`, slot ? "ok" : "warn");
  });
  eventBus.on("pickup.collected", (p = {}) => {
    const globeId = String(p.globeId || p.id || "").trim();
    const type = String(p.type || "").trim().toLowerCase();
    markPerf("resource.globe_pickup", { type, globeId });
    kwsBridge.pushLogLine(`TRACE globe_pickup:${type || "-"}:${globeId || "-"}`, type === "energy_globe" ? "ok" : "warn");
  });
  eventBus.on("energy.globe_inventory_changed", (p = {}) => {
    const stored = Number(p.stored);
    const globes = Array.isArray(p.globes) ? p.globes : [];
    const bound = globes.filter((globe) => String(globe && globe.state || "") === "bound").length;
    markPerf("resource.globe_inventory", {
      stored: Number.isFinite(stored) ? stored : -1,
      bound,
      globeCount: globes.length,
    });
    kwsBridge.pushLogLine(
      `TRACE globe_inventory:stored:${Number.isFinite(stored) ? stored : "-"}:bound:${bound}`,
      "muted"
    );
  });
  eventBus.on(RECEIVER_EVENTS.EVT_VOICE_SPELL_REJECTED, (p = {}) => {
    const reason = String(p.reason || "").trim().toLowerCase() || "-";
    const spell = String((p.castActionId || p.sourceWordId || p.wordId || p.spellId || p.spell) || "").trim().toLowerCase() || "-";
    const slot = String(p.slot || p.directionGroup || "").trim().toUpperCase() || "-";
    const required = Number(p.requiredGlobes);
    const stored = Number(p.storedGlobes);
    markPerf("spell.rejected", {
      reason,
      spell,
      slot,
      requiredGlobes: Number.isFinite(required) ? required : -1,
      storedGlobes: Number.isFinite(stored) ? stored : -1,
    });
    kwsBridge.pushLogLine(
      `TRACE spell_rejected:${reason}:spell:${spell}:slot:${slot}:required:${Number.isFinite(required) ? required : "-"}:stored:${Number.isFinite(stored) ? stored : "-"}`,
      reason === "insufficient_globes" ? "warn" : "muted"
    );
  });
  eventBus.on(RECEIVER_EVENTS.EVT_VOICE_TOKEN_DETECTED, (p = {}) => {
    const token = String(p.token || "").trim().toLowerCase();
    if (!token) return;
    const { mode, tokens } = getListenPolicyTraceState();
    const listenable = tokens.has(token);
    kwsBridge.pushLogLine(`TRACE leak:token:${token}:mode:${mode}:listenable:${listenable ? "yes" : "no"}`, listenable ? "muted" : "warn");
    if (token === "orbis" || token === "are kay nah" || token === "are_kay_nah") {
      kwsBridge.pushLogLine(`TRACE token:${token}`, "muted");
    }
  });
  eventBus.on(RECEIVER_EVENTS.EVT_VOICE_KWS_WORD_CANDIDATE || RECEIVER_EVENTS.EVT_VOICE_KWS_SPELL_CANDIDATE, (p = {}) => {
    const matched = !!p.matched;
    const wordId = String((p.wordId ?? p.spellId) || "").trim().toLowerCase();
    const phrase = String(p.phrase || "").trim().toLowerCase();
    const signal = wordId || phrase || "-";
    const { mode, tokens } = getListenPolicyTraceState();
    const listenable = tokens.has(signal);
    kwsBridge.pushLogLine(
      `TRACE leak:candidate:${signal}:matched:${matched ? "yes" : "no"}:mode:${mode}:listenable:${listenable ? "yes" : "no"}`,
      (matched && !listenable) ? "warn" : "muted"
    );
  });
  eventBus.on(RECEIVER_EVENTS.EVT_VOICE_WORD_DETECTED, (p = {}) => {
    const wordId = String((p.word && p.word.id) || (p.spell && p.spell.id) || p.wordId || p.spellId || "")
      .trim()
      .toLowerCase();
    if (!wordId) return;
    const { mode, tokens } = getListenPolicyTraceState();
    const listenable = tokens.has(wordId);
    kwsBridge.pushLogLine(`TRACE leak:word:${wordId}:mode:${mode}:listenable:${listenable ? "yes" : "no"}`, listenable ? "muted" : "warn");
    if (wordId === "orbis" || wordId === "domus" || wordId === "electrum" || wordId === "pyro" || wordId === "rota") {
      kwsBridge.pushLogLine(`TRACE word:${wordId}`, "muted");
    }
  });
  eventBus.on(RULE_ENGINE_PREVIEW_MATCHED_EVENT, (p = {}) => {
    const ruleId = String(p.ruleId || "").trim().toLowerCase();
    if (
      ruleId === "wake_main" ||
      ruleId === "tele_home" ||
      ruleId === "electric_aoe" ||
      ruleId === "electric_aoe_cast" ||
      ruleId === "shake_ud_cast" ||
      ruleId === "shake_lr_cast" ||
      ruleId === "shake_fb_cast" ||
      ruleId === "spin_y_opens_pyro" ||
      ruleId === "spin_y_pyro_opens_azerith" ||
      ruleId === "spin_y_pyro_azerith_bind_fb"
    ) {
      kwsBridge.pushLogLine(`TRACE matched:${ruleId}`, "ok");
    }
  });
  eventBus.on(RULE_ENGINE_WAKE_WIN_OPENED_EVENT, (p = {}) => {
    const actionId = String(p.actionId || "").trim().toLowerCase();
    const ruleId = String(p.ruleId || "").trim().toLowerCase();
    if (ruleId === "wake_main") {
      const windowId = String(p.windowId || "").trim().toLowerCase() || actionId || "wake.main";
      kwsBridge.pushLogLine(`TRACE wake_open:${windowId}`, "ok");
    }
    if (ruleId === "spin_y_opens_pyro") {
      const windowId = String(p.windowId || "").trim().toLowerCase() || "chain.spin_y_seed";
      kwsBridge.pushLogLine(`TRACE wake_open:${windowId}`, "ok");
    }
    if (ruleId === "spin_y_pyro_opens_azerith") {
      const windowId = String(p.windowId || "").trim().toLowerCase() || "chain.spin_y_loaded";
      kwsBridge.pushLogLine(`TRACE wake_open:${windowId}`, "ok");
    }
  });
  eventBus.on(RULE_ENGINE_ACTION_EXECUTED_EVENT, (p = {}) => {
    const actionType = String(p.actionType || "").trim().toLowerCase();
    const actionId = String(p.actionId || "").trim().toLowerCase();
    if (actionType === "event" && actionId === "teleport") {
      kwsBridge.pushLogLine("TRACE action:event:teleport", "ok");
    }
    if (actionType === "event" && actionId === "aoe_electric") {
      kwsBridge.pushLogLine("TRACE action:event:aoe_electric", "ok");
    }
    if (actionType === "event" && actionId === "shockwave") {
      kwsBridge.pushLogLine("TRACE action:event:shockwave", "ok");
    }
    if (actionType === "bind" && actionId === "fb") {
      kwsBridge.pushLogLine("TRACE action:bind:fb", "ok");
    }
  });
  eventBus.on(RULE_ENGINE_SOURCE_EVENT_SUMMARY_EVENT, (p = {}) => {
    const sourceEvent = String(p.sourceEvent || "").trim().toLowerCase();
    if (sourceEvent !== "voice.token_detected" && sourceEvent !== "voice.word_detected") return;
    const signalId = String(p.signalId || "").trim().toLowerCase();
    const ruleId = String(p.ruleId || "").trim().toLowerCase();
    const matched = Number.isFinite(Number(p.matchedRuleCount)) ? Number(p.matchedRuleCount) : 0;
    const executed = Number.isFinite(Number(p.executedActionCount)) ? Number(p.executedActionCount) : 0;
    kwsBridge.pushLogLine(
      `TRACE source:${sourceEvent}:signal:${signalId || "-"}:rule:${ruleId || "-"}:matched:${matched}:actions:${executed}`,
      matched > 0 ? "ok" : "muted"
    );
  });
  eventBus.on("voice.kws_listen_policy_changed", (p = {}) => {
    const mode = String(p.mode || "").trim().toUpperCase() || "-";
    const tokens = Array.isArray(p.listenableTokens) ? p.listenableTokens.join(",") : "";
    const reason = String(p.reason || "update").trim().toLowerCase() || "update";
    const windows = Array.isArray(p.openWindowIds) && p.openWindowIds.length
      ? p.openWindowIds.join(",")
      : "-";
    kwsBridge.pushLogLine(`TRACE kws_policy:${mode}:reason:${reason}:windows:${windows}:tokens:${tokens || "-"}`, "muted");
    if (reason === "window_refreshed") {
      kwsBridge.pushLogLine(`TRACE wake_refresh:${windows}`, "ok");
    }
    const runtimeStatus = kwsRuntimeController && typeof kwsRuntimeController.getStatus === "function"
      ? kwsRuntimeController.getStatus()
      : null;
    const backendStatus = runtimeStatus && runtimeStatus.audioBackendStatus && typeof runtimeStatus.audioBackendStatus === "object"
      ? runtimeStatus.audioBackendStatus
      : null;
    const parserStatus = runtimeStatus && runtimeStatus.parser && typeof runtimeStatus.parser === "object"
      ? runtimeStatus.parser
      : null;
    const backendActiveTokens = Array.isArray(backendStatus && backendStatus.activeTokens)
      ? backendStatus.activeTokens.join(",")
      : "-";
    const parserVocab = Number.isFinite(Number(parserStatus && parserStatus.activeTokenVocabularySize))
      ? Number(parserStatus.activeTokenVocabularySize)
      : 0;
    const inferReady = backendStatus && Object.prototype.hasOwnProperty.call(backendStatus, "inferReady")
      ? (backendStatus.inferReady ? "yes" : "no")
      : "-";
    const inferLoading = backendStatus && Object.prototype.hasOwnProperty.call(backendStatus, "inferLoading")
      ? (backendStatus.inferLoading ? "yes" : "no")
      : "-";
    const inferInitStep = String(backendStatus && backendStatus.inferInitStep || "").trim().toLowerCase() || "-";
    const inferError = String(backendStatus && backendStatus.inferError || "").trim() || "-";
    kwsBridge.pushLogLine(
      `TRACE kws_runtime:${mode}:backend_tokens:${backendActiveTokens}:parser_vocab:${parserVocab}:infer_ready:${inferReady}:infer_loading:${inferLoading}:infer_init:${inferInitStep}:infer_error:${inferError}`,
      "muted"
    );
  });
}
