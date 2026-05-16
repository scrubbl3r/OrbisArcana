import { INTERACTION_GRAPH_V2 } from "../../../content/interactions-v2/interaction-graph-v2.js?v=20260516a";
import { ACTIVE_WORDS_BY_ID } from "../../../voice/wordbook.js";

function normalizeShellWordId(value) {
  return String(value || "").trim().toLowerCase().replace(/^word\./, "").replace(/^spell\./, "");
}

function normalizeShellToken(value) {
  return String(value || "").trim().toLowerCase();
}

function resolveShellEventAtMs(value) {
  const atMs = Number(value);
  if (!Number.isFinite(atMs) || atMs < 100000000000) {
    return Date.now();
  }
  return atMs;
}

function buildShellRootWakeWindowMap() {
  const rules = Array.isArray(INTERACTION_GRAPH_V2 && INTERACTION_GRAPH_V2.rules)
    ? INTERACTION_GRAPH_V2.rules
    : [];
  const bySignal = new Map();
  for (const rule of rules) {
    const onWordId = normalizeShellWordId(rule && rule.on && rule.on.word);
    const open = rule && rule.open && typeof rule.open === "object" ? rule.open : null;
    if (!onWordId || !open || (rule && rule.requires)) continue;
    const words = Array.isArray(open.words)
      ? open.words.map((wordId) => normalizeShellWordId(wordId)).filter(Boolean)
      : [];
    if (!words.length) continue;
    const wordMeta = ACTIVE_WORDS_BY_ID[onWordId];
    const phrase = normalizeShellToken(wordMeta && (wordMeta.phrase || wordMeta.id));
    const entry = Object.freeze({
      ruleId: String(rule && rule.id || "").trim().toLowerCase(),
      triggerWordId: onWordId,
      triggerPhrase: phrase,
      windowId: String(open.id || rule.id || "").trim().toLowerCase(),
      words,
      ttlMs: Math.max(0, Number(open.ttlMs) || 0),
    });
    bySignal.set(onWordId, entry);
    if (phrase) bySignal.set(phrase, entry);
  }
  return bySignal;
}

const SHELL_ROOT_WAKE_WINDOW_MAP = buildShellRootWakeWindowMap();

function resolveShellRootWakeWindow(payload = {}) {
  const wordId = normalizeShellWordId(
    (payload.word && payload.word.id)
    || (payload.spell && payload.spell.id)
    || payload.wordId
    || payload.spellId
  );
  if (wordId && SHELL_ROOT_WAKE_WINDOW_MAP.has(wordId)) {
    return SHELL_ROOT_WAKE_WINDOW_MAP.get(wordId);
  }
  const token = normalizeShellToken(payload.token || payload.transcript);
  if (token && SHELL_ROOT_WAKE_WINDOW_MAP.has(token)) {
    return SHELL_ROOT_WAKE_WINDOW_MAP.get(token);
  }
  return null;
}

export function bindShellRootWakeWindows({ eventBus, receiverEvents = {}, kwsBridge = null } = {}) {
  if (!eventBus || typeof eventBus.on !== "function" || typeof eventBus.emit !== "function") {
    return { dispose() {} };
  }
  const tokenEvent = String(receiverEvents.EVT_VOICE_TOKEN_DETECTED || "voice.token_detected");
  const wordEvent = String(receiverEvents.EVT_VOICE_WORD_DETECTED || "voice.word_detected");
  const lastOpenedAtByWindowId = new Map();
  const unsub = [];

  function maybeEmitWakeWindow(payload = {}, sourceEvent = "") {
    const wake = resolveShellRootWakeWindow(payload);
    if (!wake) return;
    const now = resolveShellEventAtMs(payload.atMs);
    const prev = Number(lastOpenedAtByWindowId.get(wake.windowId) || 0);
    if (prev && (now - prev) < 180) return;
    lastOpenedAtByWindowId.set(wake.windowId, now);
    eventBus.emit("rule_engine.wake_win_opened", {
      ruleId: wake.ruleId,
      actionId: wake.windowId,
      windowId: wake.windowId,
      words: wake.words.slice(),
      ttlMs: wake.ttlMs,
      atMs: now,
      sourceEvent: String(sourceEvent || ""),
    });
    if (kwsBridge && typeof kwsBridge.pushLogLine === "function") {
      kwsBridge.pushLogLine(
        `TRACE wake_open:${wake.windowId}:words:${Array.isArray(wake.words) && wake.words.length ? wake.words.join(",") : "-"}:ttl:${Number(wake.ttlMs) || 0}:at:${now}`,
        "ok"
      );
    }
  }

  unsub.push(eventBus.on(tokenEvent, (payload = {}) => {
    maybeEmitWakeWindow(payload, tokenEvent);
  }));
  unsub.push(eventBus.on(wordEvent, (payload = {}) => {
    maybeEmitWakeWindow(payload, wordEvent);
  }));

  return {
    dispose() {
      while (unsub.length) {
        const off = unsub.pop();
        try { off(); } catch (_) {}
      }
    },
  };
}

export function bindShellWakeWindowVisuals({ eventBus, kwsPanelController = null, kwsBridge = null } = {}) {
  if (!eventBus || typeof eventBus.on !== "function" || !kwsPanelController) {
    return { dispose() {} };
  }

  const activeWakeWindowTokensByWindowId = new Map();
  let wakeWindowExpiryTO = 0;

  function clearWakeWindowExpiryTimer() {
    if (!wakeWindowExpiryTO) return;
    clearTimeout(wakeWindowExpiryTO);
    wakeWindowExpiryTO = 0;
  }

  function syncWakeWindowVisualTokens() {
    if (typeof kwsPanelController.setManualWakeWindowTokens !== "function") return;
    const now = Date.now();
    const activeTokens = [];
    const activeWindows = [];
    const windowDebug = [];
    for (const [windowId, entry] of activeWakeWindowTokensByWindowId.entries()) {
      windowDebug.push(
        `${Array.isArray(entry.tokens) ? entry.tokens.join(",") : "-"}@${Number(entry.expiresAtMs || 0)}`
      );
      if (Number(entry.expiresAtMs || 0) <= now) continue;
      activeTokens.push(...entry.tokens);
      activeWindows.push({
        windowId,
        tokens: Array.isArray(entry.tokens) ? entry.tokens.slice() : [],
        expiresAtMs: Number(entry.expiresAtMs || 0),
      });
    }
    kwsPanelController.setManualWakeWindowTokens(Array.from(new Set(activeTokens)));
    if (typeof kwsPanelController.setManualWakeWindows === "function") {
      kwsPanelController.setManualWakeWindows(activeWindows);
    }
    if (typeof kwsPanelController.refreshPathBoard === "function") {
      kwsPanelController.refreshPathBoard();
    }
    if (kwsBridge && typeof kwsBridge.pushLogLine === "function") {
      kwsBridge.pushLogLine(
        `TRACE tree.visual tokens:${activeTokens.length ? Array.from(new Set(activeTokens)).join(",") : "-"} windows:${windowDebug.length ? windowDebug.join("|") : "-"}`,
        "muted"
      );
    }
  }

  function scheduleWakeWindowExpirySweep() {
    clearWakeWindowExpiryTimer();
    let nextExpiry = 0;
    for (const entry of activeWakeWindowTokensByWindowId.values()) {
      const expiresAtMs = Number(entry.expiresAtMs || 0);
      if (!expiresAtMs) continue;
      if (!nextExpiry || expiresAtMs < nextExpiry) nextExpiry = expiresAtMs;
    }
    if (!nextExpiry) return;
    wakeWindowExpiryTO = setTimeout(() => {
      wakeWindowExpiryTO = 0;
      const now = Date.now();
      for (const [windowId, entry] of activeWakeWindowTokensByWindowId.entries()) {
        if (Number(entry.expiresAtMs || 0) <= now) {
          activeWakeWindowTokensByWindowId.delete(windowId);
        }
      }
      syncWakeWindowVisualTokens();
      scheduleWakeWindowExpirySweep();
    }, Math.max(0, nextExpiry - Date.now()));
  }

  const off = eventBus.on("rule_engine.wake_win_opened", (payload = {}) => {
    const windowId = String(payload.windowId || payload.actionId || "").trim().toLowerCase();
    const tokens = (Array.isArray(payload.words) ? payload.words : [])
      .map((token) => normalizeShellToken(token))
      .filter(Boolean);
    if (!windowId || !tokens.length) return;
    const atMs = resolveShellEventAtMs(payload.atMs);
    const ttlMs = Math.max(250, Number(payload.ttlMs) || 1500);
    activeWakeWindowTokensByWindowId.set(windowId, {
      tokens,
      expiresAtMs: atMs + ttlMs,
    });
    syncWakeWindowVisualTokens();
    scheduleWakeWindowExpirySweep();
  });

  return {
    dispose() {
      clearWakeWindowExpiryTimer();
      try { off(); } catch (_) {}
    },
  };
}
