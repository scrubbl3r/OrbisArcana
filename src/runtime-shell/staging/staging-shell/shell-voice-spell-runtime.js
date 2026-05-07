export function executeShellWordCastAction(shellContext, castActionId, context = {}) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const shellKws = runtime && runtime.kws ? runtime.kws : null;
  const shellSpellCastExecutor = shellKws && shellKws.shellSpellCastExecutor ? shellKws.shellSpellCastExecutor : null;
  if (!shellSpellCastExecutor || typeof shellSpellCastExecutor.execute !== "function") {
    return { handled: false, skipped: "executor_unavailable" };
  }
  try {
    const result = shellSpellCastExecutor.execute(castActionId, context);
    return result && typeof result === "object" ? result : { handled: !!result };
  } catch (error) {
    return {
      handled: false,
      skipped: "action_threw",
      reason: error && error.message ? String(error.message) : String(error || "unknown_error"),
    };
  }
}

export function handleShellVoiceSpellCast(shellContext, payload = {}) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const shellKws = runtime && runtime.kws ? runtime.kws : null;
  if (!runtime || !shellKws) return { handled: false, skipped: "shell_kws_unavailable" };
  const runtimeWordIndex = shellKws.runtimeWordIndex || Object.create(null);
  const runtimeSpellIndex = shellKws.runtimeSpellIndex || runtimeWordIndex;
  const intent = String(payload.intent || "");
  const wordId = String((payload.sourceWordId || payload.wordId || payload.spellId) || "").trim().toLowerCase();
  const payloadCastActionId = String(payload.castActionId || "").trim().toLowerCase();
  const wordDef = runtimeWordIndex[wordId] || runtimeSpellIndex[wordId] || null;
  const castActionId = payloadCastActionId || String((wordDef && wordDef.castActionId) || wordId || "");
  if (runtime.perfTrace && typeof runtime.perfTrace.mark === "function") {
    runtime.perfTrace.mark("spell.voice_cast", {
      wordId,
      castActionId,
      slot: String(payload.slot || payload.directionGroup || ""),
      trigger: String(payload.trigger || ""),
    });
  }
  const result = executeShellWordCastAction(shellContext, castActionId, { payload, intent });
  if (runtime.perfTrace && typeof runtime.perfTrace.mark === "function") {
    runtime.perfTrace.mark("spell.action_result", {
      castActionId,
      handled: !!(result && result.handled),
      skipped: String(result && result.skipped || ""),
      blocked: !!(result && result.blocked),
      reason: String(result && result.reason || ""),
    });
  }
  if (!(result && result.handled) || !wordDef) return result;
  const postCastActions = Array.isArray(wordDef.postCastActions) ? wordDef.postCastActions : null;
  if (postCastActions) {
    for (const action of postCastActions) {
      const actionId = String(action && action.id || "");
      if (!actionId) continue;
      const nextPayload = (action && typeof action.payload === "object" && action.payload)
        ? { ...payload, ...action.payload }
        : payload;
      executeShellWordCastAction(shellContext, actionId, { payload: nextPayload, intent });
    }
  } else if (Array.isArray(wordDef.postCastActionIds)) {
    for (const actionId of wordDef.postCastActionIds) {
      executeShellWordCastAction(shellContext, String(actionId || ""), { payload, intent });
    }
  }
  return result;
}
