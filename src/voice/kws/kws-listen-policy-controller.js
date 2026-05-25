import { ACTIVE_WORDS_BY_ID } from "../wordbook.js?v=20260525graviton";
import {
  DEFAULT_KWS_LISTEN_POLICY_MODE,
  KWS_LISTEN_POLICY_MODES,
} from "../voice-config.js";
import {
  COMPILED_INTERACTION_GRAPH_V2_WAKE_WORD_IDS,
} from "../../content/interactions-v2/compiled-interaction-graph-v2-wake-profile.js?v=20260525graviton";
import {
  WAKE_ARM_WORD_IDS,
} from "../../content/spells/spell-runtime-routing.js?v=20260525graviton";

const EVT_RULE_ENGINE_WAKE_WIN_OPENED = "rule_engine.wake_win_opened";
const EVT_RULE_ENGINE_PREVIEW_MATCHED = "rule_engine.preview_matched";
const EVT_KWS_LISTEN_POLICY_CHANGED = "voice.kws_listen_policy_changed";

function asWordId(raw) {
  return String(raw || "").trim().toLowerCase().replace(/^word\./, "").replace(/^spell\./, "");
}

function asSelectorList(raw) {
  if (Array.isArray(raw)) return raw.slice();
  const text = String(raw || "").trim();
  return text ? [text] : [];
}

function asMode(rawMode) {
  const mode = String(rawMode || DEFAULT_KWS_LISTEN_POLICY_MODE).trim().toUpperCase();
  return mode === KWS_LISTEN_POLICY_MODES.STRICT_A ? KWS_LISTEN_POLICY_MODES.STRICT_A : KWS_LISTEN_POLICY_MODES.COMPAT_B;
}

function resolveWordPhrase(wordId) {
  const word = ACTIVE_WORDS_BY_ID[asWordId(wordId)];
  return String((word && (word.phrase || word.id)) || "").trim().toLowerCase();
}

function resolveActiveWords(wordIds = []) {
  return normalizeWordIds(wordIds)
    .map((wordId) => ACTIVE_WORDS_BY_ID[wordId])
    .filter(Boolean)
    .map((word) => Object.freeze({ ...word }));
}

function resolveWakeArmTokens() {
  return normalizeWordIds(WAKE_ARM_WORD_IDS)
    .map((wordId) => resolveWordPhrase(wordId))
    .filter(Boolean);
}

function normalizeWordIds(rawWordIds = []) {
  return Array.from(new Set(
    (Array.isArray(rawWordIds) ? rawWordIds : [])
      .map((wordId) => asWordId(wordId))
      .filter((wordId) => !!ACTIVE_WORDS_BY_ID[wordId])
  ));
}

export function deriveStrictKwsListenPolicySnapshot({
  rootWordIds = COMPILED_INTERACTION_GRAPH_V2_WAKE_WORD_IDS,
  openWindows = [],
  nowMs = Date.now(),
} = {}) {
  const now = Number(nowMs) || Date.now();
  const normalizedRoots = normalizeWordIds(rootWordIds);
  const activeWindows = [];
  const windowWordIds = [];

  for (const windowEntry of Array.isArray(openWindows) ? openWindows : []) {
    if (!windowEntry || typeof windowEntry !== "object") continue;
    const expiresAtMs = Number(windowEntry.expiresAtMs);
    if (Number.isFinite(expiresAtMs) && expiresAtMs <= now) continue;
    const words = normalizeWordIds(windowEntry.wordIds);
    if (!words.length) continue;
    activeWindows.push(Object.freeze({
      id: String(windowEntry.id || "").trim().toLowerCase(),
      wordIds: Object.freeze(words.slice()),
      expiresAtMs: Number.isFinite(expiresAtMs) ? expiresAtMs : null,
      ttlMs: Math.max(0, Number(windowEntry.ttlMs) || 0),
      parentWindowIds: Object.freeze(
        Array.isArray(windowEntry.parentWindowIds)
          ? windowEntry.parentWindowIds.map((id) => String(id || "").trim().toLowerCase()).filter(Boolean)
          : []
      ),
    }));
    windowWordIds.push(...words);
  }

  const listenableWordIds = Array.from(new Set([...normalizedRoots, ...windowWordIds]));
  const listenableTokens = Array.from(new Set(
    listenableWordIds
      .map((wordId) => resolveWordPhrase(wordId))
      .filter(Boolean)
  ));

  return Object.freeze({
    rootWordIds: Object.freeze(normalizedRoots),
    activeWindows: Object.freeze(activeWindows),
    listenableWordIds: Object.freeze(listenableWordIds),
    listenableTokens: Object.freeze(listenableTokens),
  });
}

export function createKwsListenPolicyController({
  eventBus,
  kwsRuntimeController,
  initialMode = DEFAULT_KWS_LISTEN_POLICY_MODE,
  rootWordIds = COMPILED_INTERACTION_GRAPH_V2_WAKE_WORD_IDS,
  nowMs = () => Date.now(),
} = {}) {
  const unsub = [];
  const windowEntriesById = new Map();
  const expiryTimersById = new Map();
  let mode = asMode(initialMode);
  let lastSnapshot = deriveStrictKwsListenPolicySnapshot({ rootWordIds, openWindows: [], nowMs: nowMs() });

  function clearExpiryTimer(windowId) {
    const timer = expiryTimersById.get(windowId);
    if (!timer) return;
    clearTimeout(timer);
    expiryTimersById.delete(windowId);
  }

  function emitSnapshot(reason = "update") {
    const snapshot = deriveStrictKwsListenPolicySnapshot({
      rootWordIds,
      openWindows: Array.from(windowEntriesById.values()),
      nowMs: nowMs(),
    });
    lastSnapshot = snapshot;

    if (kwsRuntimeController && typeof kwsRuntimeController.setKwsBackendConfig === "function") {
      kwsRuntimeController.setKwsBackendConfig({
        activeTokens: mode === KWS_LISTEN_POLICY_MODES.STRICT_A
          ? snapshot.listenableTokens.slice()
          : null,
      });
    }
    if (kwsRuntimeController && typeof kwsRuntimeController.setKwsWordParserConfig === "function") {
      kwsRuntimeController.setKwsWordParserConfig({
        ...(mode === KWS_LISTEN_POLICY_MODES.STRICT_A
          ? {
            words: resolveActiveWords(snapshot.listenableWordIds),
            wakeTokens: resolveWakeArmTokens(),
            requireWakeForWordIds: [],
          }
          : {}),
      });
    }

    if (eventBus && typeof eventBus.emit === "function") {
      eventBus.emit(EVT_KWS_LISTEN_POLICY_CHANGED, {
        mode,
        reason: String(reason || "update"),
        atMs: Number(nowMs()) || Date.now(),
        rootWordIds: snapshot.rootWordIds.slice(),
        openWindowIds: snapshot.activeWindows.map((entry) => entry.id),
        listenableWordIds: snapshot.listenableWordIds.slice(),
        listenableTokens: snapshot.listenableTokens.slice(),
      });
    }

    return snapshot;
  }

  function pruneExpiredWindows() {
    const now = Number(nowMs()) || Date.now();
    for (const [windowId, entry] of windowEntriesById.entries()) {
      const expiresAtMs = Number(entry && entry.expiresAtMs);
      if (Number.isFinite(expiresAtMs) && expiresAtMs <= now) {
        clearExpiryTimer(windowId);
        windowEntriesById.delete(windowId);
      }
    }
  }

  function scheduleWindowExpiry(windowId, expiresAtMs) {
    clearExpiryTimer(windowId);
    if (!Number.isFinite(expiresAtMs)) return;
    const delayMs = Math.max(0, Math.round(expiresAtMs - ((Number(nowMs()) || Date.now()))));
    const timer = setTimeout(() => {
      expiryTimersById.delete(windowId);
      const current = windowEntriesById.get(windowId);
      const currentExpiresAtMs = Number(current && current.expiresAtMs);
      if (current && (!Number.isFinite(currentExpiresAtMs) || currentExpiresAtMs <= expiresAtMs)) {
        windowEntriesById.delete(windowId);
      }
      pruneExpiredWindows();
      emitSnapshot("window_expired");
    }, delayMs);
    expiryTimersById.set(windowId, timer);
  }

  function refreshWindowChain(windowId, atMs, visited = new Set()) {
    const normalizedWindowId = String(windowId || "").trim().toLowerCase();
    if (!normalizedWindowId || visited.has(normalizedWindowId)) return false;
    visited.add(normalizedWindowId);
    const entry = windowEntriesById.get(normalizedWindowId);
    if (!entry) return false;
    const ttlMs = Math.max(0, Number(entry.ttlMs) || 0);
    let changed = false;
    if (ttlMs > 0) {
      const nextExpiresAtMs = atMs + ttlMs;
      entry.expiresAtMs = nextExpiresAtMs;
      scheduleWindowExpiry(normalizedWindowId, nextExpiresAtMs);
      changed = true;
    }
    const parentWindowIds = Array.isArray(entry.parentWindowIds) ? entry.parentWindowIds : [];
    for (const parentWindowId of parentWindowIds) {
      if (refreshWindowChain(parentWindowId, atMs, visited)) changed = true;
    }
    return changed;
  }

  function onWakeWindowOpened(payload = {}) {
    const rawWindowId = String(payload.windowId || payload.actionId || "").trim().toLowerCase();
    const wordIds = normalizeWordIds(asSelectorList(payload.words || payload.spells));
    if (!rawWindowId || !wordIds.length) return;
    const atMs = Number(payload.atMs) || Number(nowMs()) || Date.now();
    const ttlMs = Number(payload.ttlMs);
    const expiresAtMs = Number.isFinite(ttlMs) && ttlMs > 0 ? atMs + ttlMs : null;
    const parentWindowIds = Array.from(new Set(
      asSelectorList(payload.requiresWindowIds)
        .map((id) => String(id || "").trim().toLowerCase())
        .filter(Boolean)
    ));
    windowEntriesById.set(rawWindowId, {
      id: rawWindowId,
      wordIds,
      expiresAtMs,
      ttlMs: Number.isFinite(ttlMs) ? Math.max(0, ttlMs) : 0,
      parentWindowIds,
    });
    if (expiresAtMs != null) scheduleWindowExpiry(rawWindowId, expiresAtMs);
    emitSnapshot("wake_window_opened");
  }

  function onRuleMatched(payload = {}) {
    const atMs = Number(payload.atMs) || Number(nowMs()) || Date.now();
    const requiresWindowIds = Array.from(new Set(
      asSelectorList(payload.requiresWindowIds)
        .map((id) => String(id || "").trim().toLowerCase())
        .filter(Boolean)
    ));
    if (!requiresWindowIds.length) return;
    let changed = false;
    for (const windowId of requiresWindowIds) {
      if (refreshWindowChain(windowId, atMs)) changed = true;
    }
    if (changed) emitSnapshot("window_refreshed");
  }

  function start() {
    if (eventBus && typeof eventBus.on === "function") {
      unsub.push(eventBus.on(EVT_RULE_ENGINE_WAKE_WIN_OPENED, onWakeWindowOpened));
      unsub.push(eventBus.on(EVT_RULE_ENGINE_PREVIEW_MATCHED, onRuleMatched));
    }
    emitSnapshot("start");
    return getStatus();
  }

  function stop() {
    while (unsub.length) {
      const off = unsub.pop();
      try { off(); } catch (_) {}
    }
    for (const windowId of expiryTimersById.keys()) clearExpiryTimer(windowId);
  }

  function setMode(nextMode) {
    mode = asMode(nextMode);
    pruneExpiredWindows();
    emitSnapshot("mode_changed");
    return getStatus();
  }

  function getStatus() {
    return {
      mode,
      listenableWordIds: lastSnapshot.listenableWordIds.slice(),
      listenableTokens: lastSnapshot.listenableTokens.slice(),
      rootWordIds: lastSnapshot.rootWordIds.slice(),
      openWindowIds: lastSnapshot.activeWindows.map((entry) => entry.id),
    };
  }

  return Object.freeze({
    start,
    stop,
    setMode,
    getStatus,
    getSnapshot: () => lastSnapshot,
  });
}
