import { resolveBubbleShieldGeometry } from "../../../../src/game-runtime/orb/orb-spell-geometry.js";

export function createShieldPreview({
  els,
  GEOM,
  clamp,
  evenPx,
  setVar,
}) {
  const SHIELD_DECAY_MS = 2000;
  const SHIELD_FADEIN_MS = 750;
  let shieldTO = null;
  let shieldDecayTO = null;
  let shieldFadeTO = null;

  function getOrbDiameterPx() {
    const root = els && els.previewRoot;
    const cssDiameter = root
      ? Number(getComputedStyle(root).getPropertyValue("--orb-d").replace("px", ""))
      : 0;
    return Math.max(2, cssDiameter || Number(GEOM && GEOM.orbD) || 100);
  }

  function applyGeometry() {
    GEOM.shieldD = evenPx(els.shieldD.value, 2, 2000);
    GEOM.shieldStroke = evenPx(els.shieldStroke.value, 2, 40);
    const resolved = resolveBubbleShieldGeometry({
      diameterPx: GEOM.shieldD,
      strokeWidthPx: GEOM.shieldStroke,
    }, {
      orbDiameterPx: getOrbDiameterPx(),
      normalizeStroke: (value) => Math.max(1, Math.round(value)),
    });

    els.shieldD.value = String(GEOM.shieldD);
    els.shieldStroke.value = String(GEOM.shieldStroke);
    els.vShieldD.textContent = String(GEOM.shieldD);
    els.vShieldStroke.textContent = String(GEOM.shieldStroke);

    setVar("--shield-d", `${Number(resolved.diameterPx).toFixed(2)}px`);
    setVar("--shield-stroke", `${Number(resolved.strokeWidthPx).toFixed(2)}px`);
  }

  function cancelDecay() {
    if (shieldDecayTO) {
      clearTimeout(shieldDecayTO);
      shieldDecayTO = null;
    }
    if (els.shield) els.shield.style.opacity = "";
  }

  function cancelFade() {
    if (shieldFadeTO) {
      clearTimeout(shieldFadeTO);
      shieldFadeTO = null;
    }
  }

  function setFade(v) {
    const val = clamp(v, 0, 1);
    if (els.shield) els.shield.style.setProperty("--shield-fade", String(val));
  }

  function apply() {
    const ms = clamp(els.shieldMs.value, 80, 1200);
    const a = clamp(els.shieldAlpha.value, 0, 1);
    els.shieldMs.value = String(Math.round(ms));
    els.vShieldAlpha.textContent = a.toFixed(2);

    setVar("--shield-alpha", a.toFixed(2));
    setVar("--shield-pulse-max", a.toFixed(2));
  }

  function applyPulse() {
    const pMs = Math.round(clamp(els.pulseMs.value, 20, 700));
    let pMin = clamp(els.pulseMin.value, 0, 1);
    let pMax = clamp(els.pulseMax.value, 0, 1);

    if (pMin > pMax) {
      const t = pMin; pMin = pMax; pMax = t;
      els.pulseMin.value = pMin.toFixed(2);
      els.pulseMax.value = pMax.toFixed(2);
    }

    const a = clamp(els.shieldAlpha.value, 0, 1);
    const maxClamped = Math.min(pMax, a);

    els.vPulseMs.textContent = String(pMs);
    els.vPulseMin.textContent = pMin.toFixed(2);
    els.vPulseMax.textContent = maxClamped.toFixed(2);

    setVar("--shield-pulse-ms", `${pMs}ms`);
    setVar("--shield-pulse-min", pMin.toFixed(2));
    setVar("--shield-pulse-max", maxClamped.toFixed(2));
  }

  function offNow() {
    cancelDecay();
    cancelFade();
    setFade(1);
    els.shield.classList.remove("on");
    els.shield.style.opacity = "";
    els.shield.style.animation = "";
  }

  function onNow() {
    apply();
    applyPulse();
    cancelDecay();
    cancelFade();

    if (!els.shield.classList.contains("on")) {
      offNow();
      void els.shield.offsetWidth;
      els.shield.classList.add("on");
    }

    els.shield.style.animation = "";
    els.shield.style.transition = `filter ${SHIELD_FADEIN_MS}ms linear`;
    requestAnimationFrame(() => {
      setFade(1);
    });
    shieldFadeTO = setTimeout(() => {
      shieldFadeTO = null;
      els.shield.style.transition = "";
    }, SHIELD_FADEIN_MS);
  }

  function decay() {
    if (shieldDecayTO) return;
    els.shield.style.animation = "";
    els.shield.style.transition = `filter ${SHIELD_DECAY_MS}ms linear`;
    requestAnimationFrame(() => {
      setFade(0);
    });
    shieldDecayTO = setTimeout(() => {
      shieldDecayTO = null;
      els.shield.style.transition = "";
      offNow();
    }, SHIELD_DECAY_MS);
  }

  function play() {
    onNow();

    if (shieldTO) clearTimeout(shieldTO);
    const ms = clamp(els.shieldMs.value, 80, 1200);

    shieldTO = setTimeout(() => {
      decay();
      shieldTO = null;
    }, Math.max(80, ms));
  }

  function wire() {
    els.playShield.addEventListener("click", play);
    els.shieldMs.addEventListener("input", apply);
    els.shieldAlpha.addEventListener("input", () => { apply(); applyPulse(); });
    els.shieldD.addEventListener("input", applyGeometry);
    els.shieldStroke.addEventListener("input", applyGeometry);
    els.pulseMs.addEventListener("input", applyPulse);
    els.pulseMin.addEventListener("input", applyPulse);
    els.pulseMax.addEventListener("input", applyPulse);
    applyGeometry();
    apply();
    applyPulse();
    offNow();
  }

  return {
    apply,
    applyGeometry,
    applyPulse,
    clear: offNow,
    play,
    wire,
  };
}
