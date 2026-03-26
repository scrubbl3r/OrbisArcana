import { ACTIVE_WORDS_BY_ID } from "../wordbook.js";
import {
  DEFAULT_KWS_LISTEN_POLICY_MODE,
  KWS_LISTEN_POLICY_MODES,
} from "../voice-config.js";
import {
  ORCHESTRATOR_V2_WAKE_WORD_IDS,
} from "../../content/interactions-v2/orchestrator-v2-wake-profile.js";

const EVT_RULE_ENGINE_WAKE_WIN_OPENED = "rule_engine.wake_win_opened";
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

function normalizeWordIds(rawWordIds = []) {
  return Array.from(new Set(
    (Array.isArray(rawWordIds) ? rawWordIds : [])
      .map((wordId) => asWordId(wordId))
      .filter((wordId) => !!ACTIVE_WORDS_BY_ID[wordId])
  ));
}

export function deriveStrictKwsListenPolicySnapshot({
  rootWordIds = ORCHESTRATOR_V2_WAKE_WORD_IDS,
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
  rootWordIds = ORCHESTRATOR_V2_WAKE_WORD_IDS,
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
            wakeTokens: snapshot.rootWordIds.map((wordId) => resolveWordPhrase(wordId)).filter(Boolean),
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
      pruneExpiredWindows();
      emitSnapshot("window_expired");
    }, delayMs);
    expiryTimersById.set(windowId, timer);
  }

  function onWakeWindowOpened(payload = {}) {
    const rawWindowId = String(payload.windowId || payload.actionId || "").trim().toLowerCase();
    const wordIds = normalizeWordIds(asSelectorList(payload.words || payload.spells));
    if (!rawWindowId || !wordIds.length) return;
    const atMs = Number(payload.atMs) || Number(nowMs()) || Date.now();
    const ttlMs = Number(payload.ttlMs);
    const expiresAtMs = Number.isFinite(ttlMs) && ttlMs > 0 ? atMs + ttlMs : null;
    windowEntriesById.set(rawWindowId, {
      id: rawWindowId,
      wordIds,
      expiresAtMs,
    });
    if (expiresAtMs != null) scheduleWindowExpiry(rawWindowId, expiresAtMs);
    emitSnapshot("wake_window_opened");
  }

  function start() {
    if (eventBus && typeof eventBus.on === "function") {
      unsub.push(eventBus.on(EVT_RULE_ENGINE_WAKE_WIN_OPENED, onWakeWindowOpened));
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
