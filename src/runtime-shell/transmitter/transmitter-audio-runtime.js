export function createTransmitterAudioRuntime({
  rootWindow = window,
  toneBaseHz = 180,
  toneMaxAddHz = 220,
  masterGain = 2.2,
  clamp01 = (v) => Math.max(0, Math.min(1, Number(v) || 0)),
  energyToGain = (e01) => {
    const t = clamp01(e01);
    return t * t;
  },
} = {}) {
  let audioCtx = null;
  let osc = null;
  let gainNode = null;

  function ensureAudio() {
    if (audioCtx) return audioCtx;

    const AudioCtor = rootWindow.AudioContext || rootWindow.webkitAudioContext;
    if (!AudioCtor) return null;

    audioCtx = new AudioCtor();
    gainNode = audioCtx.createGain();
    gainNode.gain.value = 0;

    osc = audioCtx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = toneBaseHz;

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start();

    return audioCtx;
  }

  async function resume() {
    const ctx = ensureAudio();
    if (!ctx) return false;
    try {
      await ctx.resume();
    } catch (_) {
      return false;
    }
    return true;
  }

  function setAudio(energyUi, groove, locked) {
    if (!audioCtx || !gainNode || !osc) return;

    const gBase = energyToGain(clamp01(energyUi));
    const gGroove = locked ? (0.3 + 0.7 * groove) : (0.08 + 0.22 * groove);
    const gain = masterGain * gBase * gGroove;

    const freq = toneBaseHz
      + toneMaxAddHz * (locked ? groove : 0.3 * groove)
      + 60 * clamp01(energyUi);

    const now = audioCtx.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setTargetAtTime(gain, now, 0.06);

    osc.frequency.cancelScheduledValues(now);
    osc.frequency.setTargetAtTime(freq, now, 0.06);
  }

  function silence() {
    if (!audioCtx || !gainNode) return;
    const now = audioCtx.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setTargetAtTime(0, now, 0.05);
  }

  return {
    ensureAudio,
    resume,
    setAudio,
    silence,
  };
}
