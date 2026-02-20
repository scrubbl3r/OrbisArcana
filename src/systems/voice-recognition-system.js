import { VOICE_GATE_DEFAULTS, VOICE_MATCH_CONFIG, VOICE_MODES, VOICE_RECOGNITION_CONFIG } from "../voice/voice-config.js";
import { matchSpellFromTranscript } from "../voice/spell-matcher.js";
import { WAKE_TOKENS } from "../voice/spellbook.js";
import { stripWakeTokenPrefix } from "../voice/normalizer.js";

export function createVoiceRecognitionSystem({
  eventBus,
  recognitionConfig = VOICE_RECOGNITION_CONFIG,
  gateDefaults = VOICE_GATE_DEFAULTS,
  matchConfig = VOICE_MATCH_CONFIG,
}) {
  if (!eventBus || typeof eventBus.on !== "function" || typeof eventBus.emit !== "function") {
    throw new Error("createVoiceRecognitionSystem requires eventBus.on/eventBus.emit");
  }

  const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
  const unsupported = !SpeechRecognitionCtor;

  const state = {
    mode: VOICE_MODES.OFF,
    running: false,
    gateOpen: false,
    gateCloseTO: 0,
    shouldListen: false,
    restartTO: 0,
    recognition: null,
    startedAtMs: 0,
  };

  const unsub = [];

  function clearGateTimer() {
    if (!state.gateCloseTO) return;
    clearTimeout(state.gateCloseTO);
    state.gateCloseTO = 0;
  }

  function clearRestartTimer() {
    if (!state.restartTO) return;
    clearTimeout(state.restartTO);
    state.restartTO = 0;
  }

  function shouldBeListening() {
    if (unsupported) return false;
    if (state.mode === VOICE_MODES.OFF) return false;
    if (state.mode === VOICE_MODES.WAKE_TOKEN_OPEN_WORLD) return true;
    if (state.mode === VOICE_MODES.GATED_WINDOW) return !!state.gateOpen;
    return false;
  }

  function emitListeningState() {
    if (state.running) {
      eventBus.emit("voice.listening_started", {
        mode: state.mode,
        gateOpen: state.gateOpen,
        atMs: Date.now(),
      });
    } else {
      eventBus.emit("voice.listening_stopped", {
        mode: state.mode,
        gateOpen: state.gateOpen,
        atMs: Date.now(),
      });
    }
  }

  function buildRecognition() {
    if (unsupported) return null;
    const rec = new SpeechRecognitionCtor();
    rec.lang = recognitionConfig.lang || "en-US";
    rec.interimResults = !!recognitionConfig.interimResults;
    rec.continuous = !!recognitionConfig.continuous;
    rec.maxAlternatives = Math.max(1, Number(recognitionConfig.maxAlternatives) || 1);

    rec.onstart = () => {
      state.running = true;
      state.startedAtMs = Date.now();
      emitListeningState();
    };

    rec.onend = () => {
      state.running = false;
      emitListeningState();
      if (!state.shouldListen) return;
      clearRestartTimer();
      state.restartTO = setTimeout(() => {
        state.restartTO = 0;
        startListening();
      }, 120);
    };

    rec.onerror = (evt) => {
      const error = String(evt && evt.error || "unknown");
      eventBus.emit("voice.error", {
        error,
        message: String(evt && evt.message || ""),
        atMs: Date.now(),
      });
      // On fatal-ish mic errors, do not loop infinitely.
      if (error === "not-allowed" || error === "service-not-allowed") {
        state.shouldListen = false;
      }
    };

    function emitSpellDetected(match, modeForEmit, gateOpenForEmit) {
      eventBus.emit("voice.spell_detected", {
        spell: match.spell,
        transcript: match.transcript,
        confidence: Number(match.confidence) || 1,
        mode: modeForEmit,
        gateOpen: gateOpenForEmit,
        atMs: Date.now(),
      });
    }

    function emitHeard(transcript, confidence, alternatives) {
      eventBus.emit("voice.heard", {
        transcript,
        confidence,
        alternatives,
        mode: state.mode,
        gateOpen: state.gateOpen,
        atMs: Date.now(),
      });
    }

    function detectWakeAndSpellCandidate(transcript, alternatives) {
      const inputs = [transcript].concat(Array.isArray(alternatives) ? alternatives : []);
      let heardWake = false;
      let spellCandidate = "";
      for (const raw of inputs) {
        for (const wake of WAKE_TOKENS) {
          const r = stripWakeTokenPrefix(raw, wake);
          if (!r.hasWake) continue;
          heardWake = true;
          if (!spellCandidate && r.rest) spellCandidate = r.rest;
        }
      }
      return { heardWake, spellCandidate };
    }

    rec.onresult = (evt) => {
      if (!evt || !evt.results) return;
      for (let i = evt.resultIndex; i < evt.results.length; i++) {
        const result = evt.results[i];
        if (!result || !result.isFinal || !result[0]) continue;

        const primary = String(result[0].transcript || "").trim();
        const confidence = Number.isFinite(Number(result[0].confidence)) ? Number(result[0].confidence) : 1;
        const alternatives = [];
        for (let j = 1; j < result.length; j++) {
          const alt = result[j];
          if (alt && alt.transcript) alternatives.push(String(alt.transcript).trim());
        }

        if (state.mode === VOICE_MODES.WAKE_TOKEN_OPEN_WORLD) {
          if (state.gateOpen) {
            // Strict armed window: spellbook-only, ignore unknown noise/conversation.
            const armedMatch = matchSpellFromTranscript({
              transcript: primary,
              alternatives,
              confidence,
              mode: VOICE_MODES.GATED_WINDOW,
            });
            if (armedMatch && armedMatch.matched) {
              emitHeard(primary, confidence, alternatives);
              emitSpellDetected(armedMatch, state.mode, state.gateOpen);
            } else if (matchConfig.keepUnknownForDebug && armedMatch && armedMatch.reason === "below_confidence") {
              emitHeard(primary, confidence, alternatives);
              eventBus.emit("voice.spell_rejected", {
                reason: armedMatch.reason,
                transcript: primary,
                confidence,
                mode: state.mode,
                gateOpen: state.gateOpen,
                atMs: Date.now(),
              });
            }
            continue;
          }

          // Wake-listen state: only wake token opens the spell window.
          const wake = detectWakeAndSpellCandidate(primary, alternatives);
          if (!wake.heardWake) continue;

          emitHeard(primary, confidence, alternatives);
          openGate({ reason: "wake_token", timeoutMs: gateDefaults.windowTimeoutMs });
          eventBus.emit("voice.wake_detected", { transcript: primary, atMs: Date.now() });

          // If user said "Orbis <spell>" in one utterance, cast immediately.
          if (wake.spellCandidate) {
            const inlineMatch = matchSpellFromTranscript({
              transcript: wake.spellCandidate,
              confidence,
              mode: VOICE_MODES.GATED_WINDOW,
            });
            if (inlineMatch && inlineMatch.matched) {
              emitSpellDetected(inlineMatch, state.mode, true);
            } else if (matchConfig.keepUnknownForDebug && inlineMatch && inlineMatch.reason === "below_confidence") {
              eventBus.emit("voice.spell_rejected", {
                reason: inlineMatch.reason,
                transcript: wake.spellCandidate,
                confidence,
                mode: state.mode,
                gateOpen: true,
                atMs: Date.now(),
              });
            }
          }
          continue;
        }

        const match = matchSpellFromTranscript({
          transcript: primary,
          alternatives,
          confidence,
          mode: state.mode,
        });

        if (match && match.matched) {
          emitHeard(primary, confidence, alternatives);
          emitSpellDetected(match, state.mode, state.gateOpen);
        } else if (matchConfig.keepUnknownForDebug) {
          emitHeard(primary, confidence, alternatives);
          eventBus.emit("voice.spell_rejected", {
            reason: (match && match.reason) || "no_spell_match",
            transcript: primary,
            confidence,
            mode: state.mode,
            gateOpen: state.gateOpen,
            atMs: Date.now(),
          });
        }
      }
    };

    return rec;
  }

  function startListening() {
    if (unsupported) return;
    if (!state.recognition) state.recognition = buildRecognition();
    if (!state.recognition || state.running) return;
    try {
      state.recognition.start();
    } catch (_) {}
  }

  function stopListening() {
    if (!state.recognition) return;
    state.shouldListen = false;
    clearRestartTimer();
    if (!state.running) return;
    try { state.recognition.stop(); } catch (_) {}
  }

  function refreshListening() {
    state.shouldListen = shouldBeListening();
    if (state.shouldListen) startListening();
    else stopListening();
  }

  function setMode(mode) {
    const next = Object.values(VOICE_MODES).includes(mode) ? mode : VOICE_MODES.OFF;
    state.mode = next;
    eventBus.emit("voice.mode_changed", {
      mode: state.mode,
      atMs: Date.now(),
    });
    refreshListening();
  }

  function openGate(payload = {}) {
    state.gateOpen = true;
    const timeoutMs = Math.max(250, Number(payload.timeoutMs) || Number(gateDefaults.windowTimeoutMs) || 4500);
    clearGateTimer();
    state.gateCloseTO = setTimeout(() => {
      state.gateCloseTO = 0;
      closeGate({ reason: "timeout" });
    }, timeoutMs);
    eventBus.emit("voice.gate_opened", {
      reason: payload.reason || "manual",
      timeoutMs,
      atMs: Date.now(),
    });
    refreshListening();
  }

  function closeGate(payload = {}) {
    state.gateOpen = false;
    clearGateTimer();
    eventBus.emit("voice.gate_closed", {
      reason: payload.reason || "manual",
      atMs: Date.now(),
    });
    refreshListening();
  }

  function start() {
    if (unsupported) {
      eventBus.emit("voice.unavailable", {
        reason: "speech_recognition_unsupported",
        atMs: Date.now(),
      });
      return;
    }

    unsub.push(eventBus.on("voice.set_mode", (p = {}) => setMode(String(p.mode || VOICE_MODES.OFF))));
    unsub.push(eventBus.on("voice.open_gate", (p = {}) => openGate(p)));
    unsub.push(eventBus.on("voice.close_gate", (p = {}) => closeGate(p)));
    unsub.push(eventBus.on("voice.toggle_gate", () => {
      if (state.gateOpen) closeGate({ reason: "toggle" });
      else openGate({ reason: "toggle" });
    }));
    unsub.push(eventBus.on("voice.start_listening", () => {
      if (state.mode === VOICE_MODES.OFF) setMode(VOICE_MODES.GATED_WINDOW);
      if (state.mode === VOICE_MODES.GATED_WINDOW && !state.gateOpen) {
        openGate({ reason: "start_listening" });
      } else {
        refreshListening();
      }
    }));
    unsub.push(eventBus.on("voice.stop_listening", () => {
      setMode(VOICE_MODES.OFF);
      closeGate({ reason: "stop_listening" });
    }));
    unsub.push(eventBus.on("voice.spell_cast", () => {
      if (gateDefaults.autoStopOnCast && state.gateOpen) {
        closeGate({ reason: "cast" });
      }
    }));

    setMode(VOICE_MODES.OFF);
  }

  function stop() {
    while (unsub.length) {
      const fn = unsub.pop();
      try { fn(); } catch (_) {}
    }
    closeGate({ reason: "stop" });
    setMode(VOICE_MODES.OFF);
    stopListening();
    if (state.recognition) {
      try {
        state.recognition.onstart = null;
        state.recognition.onend = null;
        state.recognition.onerror = null;
        state.recognition.onresult = null;
      } catch (_) {}
    }
    state.recognition = null;
  }

  return {
    start,
    stop,
    setMode,
    openGate,
    closeGate,
  };
}
