import {
  EVT_VOICE_KWS_SPELL_CANDIDATE,
  EVT_VOICE_SPELL_CAST,
  EVT_VOICE_TOKEN_DETECTED,
} from "../../contracts/events.js";
import { buildKwsSpellAliasIndex } from "./build-kws-spell-alias-index.js";
import { WAKE_TOKENS } from "../spellbook.js";

const DEFAULTS = Object.freeze({
  windowMs: 900,
  maxTokensInBuffer: 6,
  tokenThreshold: 0.5,
  wakeTokenThreshold: 0.35,
  spellCooldownMs: 150,
  wakeArmMs: 1000,
  wakeArmedMinConfidence: 0.45,
  clearBufferOnMatch: true,
  shadow: true,
});

function normToken(token) {
  return String(token || "").trim().toLowerCase();
}

function clamp01(n) {
  n = Number(n);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function minConfidence(tokens) {
  let m = 1;
  for (const t of tokens) m = Math.min(m, clamp01(t && t.confidence));
  return m;
}

/**
 * @typedef {Object} KwsTokenParserOptions
 * @property {{emit?: Function}} [eventBus]
 * @property {boolean} [shadow]
 * @property {number} [windowMs]
 * @property {number} [maxTokensInBuffer]
 * @property {number} [tokenThreshold]
 * @property {number} [spellCooldownMs]
 * @property {boolean} [clearBufferOnMatch]
 * @property {Array<Object>} [spells]
 */

/**
 * KWS token parser: consumes keyword token hits and emits spell candidates and
 * normalized `voice.spell_cast` events when active.
 *
 * This is intentionally parser-only. Audio keyword spotting belongs in a
 * separate provider/frontend.
 *
 * @param {KwsTokenParserOptions} [opts]
 */
export function createKwsTokenParser(opts = {}) {
  const eventBus = opts.eventBus || null;
  const cfg = {
    ...DEFAULTS,
    shadow: opts.shadow == null ? DEFAULTS.shadow : !!opts.shadow,
    windowMs: Number(opts.windowMs) || DEFAULTS.windowMs,
    maxTokensInBuffer: Number(opts.maxTokensInBuffer) || DEFAULTS.maxTokensInBuffer,
    tokenThreshold: Number.isFinite(Number(opts.tokenThreshold)) ? Number(opts.tokenThreshold) : DEFAULTS.tokenThreshold,
    wakeTokenThreshold: Number.isFinite(Number(opts.wakeTokenThreshold))
      ? clamp01(Number(opts.wakeTokenThreshold))
      : DEFAULTS.wakeTokenThreshold,
    spellCooldownMs: Number(opts.spellCooldownMs) || DEFAULTS.spellCooldownMs,
    wakeArmMs: Number(opts.wakeArmMs) || DEFAULTS.wakeArmMs,
    wakeArmedMinConfidence: Number.isFinite(Number(opts.wakeArmedMinConfidence))
      ? clamp01(Number(opts.wakeArmedMinConfidence))
      : DEFAULTS.wakeArmedMinConfidence,
    clearBufferOnMatch: opts.clearBufferOnMatch == null ? DEFAULTS.clearBufferOnMatch : !!opts.clearBufferOnMatch,
  };
  const wakeTokenSet = new Set(
    (Array.isArray(opts.wakeTokens) && opts.wakeTokens.length ? opts.wakeTokens : WAKE_TOKENS)
      .map((t) => normToken(t))
      .filter(Boolean),
  );
  const requireWakeForSpellIds = new Set(
    (Array.isArray(opts.requireWakeForSpellIds) && opts.requireWakeForSpellIds.length
      ? opts.requireWakeForSpellIds
      : ["domus"])
      .map((s) => String(s || "").trim().toLowerCase())
      .filter(Boolean),
  );

  const aliasIndex = buildKwsSpellAliasIndex(opts.spells);
  let enabled = true;
  let shadow = !!cfg.shadow;
  /** @type {Array<{token:string, confidence:number, atMs:number}>} */
  let tokenBuffer = [];
  let lastMatchAtMs = 0;
  let lastMatchedSpellId = "";
  let wakeArmedUntilMs = 0;
  let lastSeenAtMs = 0;

  function emit(name, payload) {
    if (eventBus && typeof eventBus.emit === "function") {
      eventBus.emit(name, payload);
    }
  }

  function reset() {
    tokenBuffer = [];
    lastMatchAtMs = 0;
    lastMatchedSpellId = "";
    wakeArmedUntilMs = 0;
    lastSeenAtMs = 0;
  }

  function setEnabled(next) {
    enabled = !!next;
  }

  function setMode(mode) {
    shadow = String(mode || "").toLowerCase() !== "active";
  }

  function setConfig(next = {}) {
    if (!next || typeof next !== "object") return getStatus();
    if (Number.isFinite(Number(next.windowMs))) cfg.windowMs = Math.max(100, Math.round(Number(next.windowMs)));
    if (Number.isFinite(Number(next.maxTokensInBuffer))) cfg.maxTokensInBuffer = Math.max(1, Math.round(Number(next.maxTokensInBuffer)));
    if (Number.isFinite(Number(next.tokenThreshold))) cfg.tokenThreshold = clamp01(next.tokenThreshold);
    if (Number.isFinite(Number(next.wakeTokenThreshold))) cfg.wakeTokenThreshold = clamp01(next.wakeTokenThreshold);
    if (Number.isFinite(Number(next.spellCooldownMs))) cfg.spellCooldownMs = Math.max(0, Math.round(Number(next.spellCooldownMs)));
    if (Number.isFinite(Number(next.wakeArmMs))) cfg.wakeArmMs = Math.max(0, Math.round(Number(next.wakeArmMs)));
    if (Number.isFinite(Number(next.wakeArmedMinConfidence))) cfg.wakeArmedMinConfidence = clamp01(next.wakeArmedMinConfidence);
    if (typeof next.clearBufferOnMatch === "boolean") cfg.clearBufferOnMatch = !!next.clearBufferOnMatch;
    return getStatus();
  }

  function prune(nowMs) {
    const cutoff = Number(nowMs) - cfg.windowMs;
    tokenBuffer = tokenBuffer.filter((t) => Number(t.atMs) >= cutoff);
    if (tokenBuffer.length > cfg.maxTokensInBuffer) {
      tokenBuffer = tokenBuffer.slice(-cfg.maxTokensInBuffer);
    }
  }

  function tryMatchSuffix(nowMs) {
    const wakeArmed = Number(nowMs) <= wakeArmedUntilMs;
    const maxLen = Math.min(tokenBuffer.length, cfg.maxTokensInBuffer);
    for (let len = maxLen; len >= 1; len--) {
      const suffix = tokenBuffer.slice(-len);
      const phraseTokens = suffix.map((t) => t.token);
      const entries = aliasIndex.byTokenCount.get(len) || [];
      for (const entry of entries) {
        let ok = true;
        for (let i = 0; i < len; i++) {
          if (entry.tokens[i] !== phraseTokens[i]) {
            ok = false;
            break;
          }
        }
        if (!ok) continue;
        const conf = minConfidence(suffix);
        const requiredConfidence = wakeArmed
          ? Math.min(Number(entry.minConfidence || cfg.tokenThreshold), Number(cfg.wakeArmedMinConfidence))
          : Number(entry.minConfidence || cfg.tokenThreshold);
        const matched = conf >= requiredConfidence;
        let suppressed = false;
        if (matched && lastMatchedSpellId === entry.spellId && (Number(nowMs) - lastMatchAtMs) < cfg.spellCooldownMs) {
          suppressed = true;
        }
        return {
          matched,
          suppressed,
          spellId: entry.spellId,
          tokens: phraseTokens,
          confidence: conf,
          alias: entry.alias,
          consumedCount: len,
        };
      }
    }
    return null;
  }

  /**
   * @param {{token:string, confidence?:number, atMs?:number, providerId?:string}} hit
   */
  function ingestToken(hit) {
    if (!enabled || !hit) return { matched: false, reason: "disabled" };
    const token = normToken(hit.token);
    if (!token) return { matched: false, reason: "empty" };
    const confidence = clamp01(hit.confidence == null ? 1 : hit.confidence);
    const atMs = Number(hit.atMs) || Date.now();
    const providerId = String(hit.providerId || "kws");
    lastSeenAtMs = atMs;
    const wakeArmed = atMs <= wakeArmedUntilMs;
    const isWakeToken = wakeTokenSet.has(token);

    emit(EVT_VOICE_TOKEN_DETECTED, {
      token,
      confidence,
      atMs,
      providerId,
      source: "kws",
    });

    const tokenThreshold = isWakeToken
      ? Number(cfg.wakeTokenThreshold) || 0
      : (wakeArmed
      ? Math.min(Number(cfg.tokenThreshold) || 0, Number(cfg.wakeArmedMinConfidence) || 0)
      : Number(cfg.tokenThreshold) || 0);
    if (confidence < tokenThreshold) {
      return { matched: false, reason: "below_token_threshold", token, confidence };
    }

    if (isWakeToken) {
      wakeArmedUntilMs = atMs + Math.max(0, Number(cfg.wakeArmMs) || 0);
      // Wake token should arm immediate follow-up parsing, not pollute spell phrase matching.
      tokenBuffer = [];
      emit(EVT_VOICE_KWS_SPELL_CANDIDATE, {
        spellId: null,
        matched: false,
        tokens: [token],
        phrase: token,
        confidence,
        suppressed: false,
        atMs,
        providerId,
        source: "kws",
      });
      return { matched: false, reason: "wake_token_armed", token, confidence, wakeArmedUntilMs };
    }

    tokenBuffer.push({ token, confidence, atMs });
    prune(atMs);

    const result = tryMatchSuffix(atMs);
    const requiresWake = !!(result && requireWakeForSpellIds.has(String(result.spellId || "").toLowerCase()));
    const blockedByWake = !!(result && requiresWake && !wakeArmed);
    const finalResult = blockedByWake
      ? { ...result, matched: false, suppressed: false }
      : result;
    const candidate = finalResult || {
      matched: false,
      spellId: null,
      tokens: tokenBuffer.map((t) => t.token),
      confidence,
      suppressed: false,
      alias: "",
      consumedCount: 0,
    };

    emit(EVT_VOICE_KWS_SPELL_CANDIDATE, {
      spellId: candidate.spellId || null,
      matched: !!candidate.matched,
      tokens: Array.isArray(candidate.tokens) ? candidate.tokens.slice() : [],
      phrase: Array.isArray(candidate.tokens) ? candidate.tokens.join(" ") : "",
      confidence: clamp01(candidate.confidence),
      suppressed: !!candidate.suppressed,
      atMs,
      providerId,
      source: "kws",
    });

    if (!finalResult || !finalResult.matched || finalResult.suppressed) {
      if (blockedByWake) {
        return { matched: false, reason: "wake_required", spellId: result && result.spellId ? result.spellId : null };
      }
      return finalResult || { matched: false, reason: "no_spell_match" };
    }

    if (!shadow) {
      emit(EVT_VOICE_SPELL_CAST, {
        spellId: finalResult.spellId,
        phrase: finalResult.alias || finalResult.tokens.join(" "),
        confidence: finalResult.confidence,
        tokens: finalResult.tokens.slice(),
        source: "kws",
        providerId,
        atMs,
      });
    }

    lastMatchedSpellId = String(finalResult.spellId || "");
    lastMatchAtMs = atMs;
    if (cfg.clearBufferOnMatch) tokenBuffer = [];
    else tokenBuffer = tokenBuffer.slice(0, Math.max(0, tokenBuffer.length - finalResult.consumedCount));

    return {
      matched: true,
      spellId: finalResult.spellId,
      confidence: finalResult.confidence,
      tokens: finalResult.tokens.slice(),
      suppressed: false,
    };
  }

  function getStatus() {
    return {
      providerId: "kws-parser",
      enabled,
      shadow,
      bufferSize: tokenBuffer.length,
      windowMs: cfg.windowMs,
      tokenThreshold: cfg.tokenThreshold,
      wakeTokenThreshold: cfg.wakeTokenThreshold,
      spellCooldownMs: cfg.spellCooldownMs,
      wakeArmMs: cfg.wakeArmMs,
      wakeArmedMinConfidence: cfg.wakeArmedMinConfidence,
      wakeArmed: wakeArmedUntilMs > lastSeenAtMs,
      maxTokensInBuffer: cfg.maxTokensInBuffer,
      clearBufferOnMatch: cfg.clearBufferOnMatch,
    };
  }

  return Object.freeze({
    ingestToken,
    reset,
    setEnabled,
    setMode,
    setConfig,
    getStatus,
    getAliasIndex: () => aliasIndex,
  });
}
