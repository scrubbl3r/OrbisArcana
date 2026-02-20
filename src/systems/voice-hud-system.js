import { VOICE_MODES } from "../voice/voice-config.js";

export function createVoiceHudSystem({ eventBus, voiceReadoutEl, voiceState }) {
  if (!eventBus || typeof eventBus.on !== "function") {
    throw new Error("createVoiceHudSystem requires eventBus.on");
  }
  if (!voiceState) throw new Error("createVoiceHudSystem requires voiceState");

  const unsub = [];

  function write(text, cls = "dim", asHtml = false) {
    if (!voiceReadoutEl) return;
    voiceReadoutEl.className = cls;
    if (asHtml) {
      voiceReadoutEl.innerHTML = String(text || "");
    } else {
      voiceReadoutEl.textContent = String(text || "");
    }
  }

  function writeWakeLabel(wakeHot) {
    if (wakeHot) {
      write(`<span class="voiceWakeHot">Wake</span>: Orbis`, "ok", true);
      return;
    }
    write("Wake: Orbis", "ok");
  }

  function modeLabel(mode) {
    if (mode === VOICE_MODES.OFF) return { text: "Off", cls: "dim" };
    if (mode === VOICE_MODES.GATED_WINDOW) return { text: "Armed (gated)", cls: "ok" };
    if (mode === VOICE_MODES.WAKE_TOKEN_OPEN_WORLD) return { text: "Wake: Orbis", cls: "ok" };
    return { text: String(mode || "Off"), cls: "dim" };
  }

  function onUnavailable() {
    voiceState.available = false;
    voiceState.lastError = "speech_recognition_unsupported";
    voiceState.lastEventAtMs = Date.now();
    write("Unavailable", "bad");
  }

  function onModeChanged(payload = {}) {
    const mode = String(payload.mode || VOICE_MODES.OFF);
    voiceState.mode = mode;
    voiceState.lastEventAtMs = Date.now();
    if (mode === VOICE_MODES.WAKE_TOKEN_OPEN_WORLD) {
      writeWakeLabel(!!voiceState.gateOpen);
      return;
    }
    const label = modeLabel(mode);
    write(label.text, label.cls);
  }

  function onGateOpened() {
    voiceState.gateOpen = true;
    voiceState.lastEventAtMs = Date.now();
    writeWakeLabel(true);
  }

  function onGateClosed() {
    voiceState.gateOpen = false;
    voiceState.lastEventAtMs = Date.now();
    if (voiceState.mode === VOICE_MODES.WAKE_TOKEN_OPEN_WORLD) {
      writeWakeLabel(false);
      return;
    }
    if (voiceState.mode === VOICE_MODES.GATED_WINDOW) write("Armed (gated)", "dim");
  }

  function onListeningStarted() {
    voiceState.listening = true;
    voiceState.lastEventAtMs = Date.now();
  }

  function onListeningStopped() {
    voiceState.listening = false;
    voiceState.lastEventAtMs = Date.now();
  }

  function onHeard(payload = {}) {
    const txt = String(payload.transcript || "").trim();
    if (!txt) return;
    voiceState.lastHeard = txt;
    voiceState.lastEventAtMs = Date.now();
    write(`Heard: ${txt}`, "dim");
  }

  function onSpellCast(payload = {}) {
    const spellId = String(payload.spellId || "spell");
    const conf = Number(payload.confidence);
    const confTxt = Number.isFinite(conf) ? ` ${conf.toFixed(2)}` : "";
    voiceState.lastSpellId = spellId;
    voiceState.lastRejectReason = "";
    voiceState.lastEventAtMs = Date.now();
    write(`Cast: ${spellId}${confTxt}`, "ok");
  }

  function onSpellLoaded(payload = {}) {
    const spellId = String(payload.spellId || "spell");
    const axis = String(payload.axis || "").toUpperCase();
    const slot = String(payload.slot || "");
    const where = axis && slot ? ` ${axis}:${slot}` : "";
    voiceState.lastSpellId = spellId;
    voiceState.lastRejectReason = "";
    voiceState.lastEventAtMs = Date.now();
    write(`Loaded:${where} ${spellId}`.trim(), "ok");
  }

  function onSpellRejected(payload = {}) {
    const reason = String(payload.reason || "rejected");
    voiceState.lastRejectReason = reason;
    voiceState.lastEventAtMs = Date.now();
    if (reason === "no_spell_match" || reason === "no_wake_or_spell_match") return;
    write(`Rejected: ${reason}`, "dim");
  }

  function onError(payload = {}) {
    voiceState.lastError = String(payload.error || "unknown");
    voiceState.lastEventAtMs = Date.now();
    write(`Error: ${voiceState.lastError}`, "bad");
  }

  function start() {
    const label = modeLabel(voiceState.mode);
    write(label.text, label.cls);
    unsub.push(eventBus.on("voice.unavailable", onUnavailable));
    unsub.push(eventBus.on("voice.mode_changed", onModeChanged));
    unsub.push(eventBus.on("voice.gate_opened", onGateOpened));
    unsub.push(eventBus.on("voice.gate_closed", onGateClosed));
    unsub.push(eventBus.on("voice.listening_started", onListeningStarted));
    unsub.push(eventBus.on("voice.listening_stopped", onListeningStopped));
    unsub.push(eventBus.on("voice.heard", onHeard));
    unsub.push(eventBus.on("voice.spell_loaded", onSpellLoaded));
    unsub.push(eventBus.on("voice.spell_cast", onSpellCast));
    unsub.push(eventBus.on("voice.spell_rejected", onSpellRejected));
    unsub.push(eventBus.on("voice.error", onError));
  }

  function stop() {
    while (unsub.length) {
      const fn = unsub.pop();
      try { fn(); } catch (_) {}
    }
  }

  return {
    start,
    stop,
  };
}
