/**
 * @typedef {Object} BubbleShieldRuntimeConfig
 * @property {number} alpha
 * @property {number} pulseMs
 * @property {number} pulseMin
 * @property {number} pulseMax
 */

/**
 * @typedef {Object} CreateBubbleShieldRuntimeOptions
 * @property {HTMLElement} shieldEl
 * @property {() => BubbleShieldRuntimeConfig} getConfig
 * @property {(name:string, value:string) => void} setCssVar
 * @property {(n:number, min:number, max:number) => number} [clamp]
 * @property {(n:number) => number} [clamp01]
 * @property {number} [fadeInMs]
 * @property {number} [decayMs]
 * @property {(active:boolean) => void} [onDecayActiveChange]
 */

/**
 * Generic bubble-shield DOM runtime (fade-in, decay, and pulse CSS var hydration).
 * Sanctum-specific color/size/lock behavior stays in the receiver shell.
 *
 * @param {CreateBubbleShieldRuntimeOptions} options
 */
export function createBubbleShieldRuntime({
  shieldEl,
  getConfig,
  setCssVar,
  clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n) || 0)),
  clamp01 = (n) => Math.max(0, Math.min(1, Number(n) || 0)),
  fadeInMs = 750,
  decayMs = 2000,
  onDecayActiveChange,
} = {}) {
  let shieldDecayTO = null;
  let shieldFadeTO = null;
  let shieldFadeVal = 1;
  let shieldDecayActive = false;

  function setDecayActive(v) {
    shieldDecayActive = !!v;
    if (typeof onDecayActiveChange === "function") onDecayActiveChange(shieldDecayActive);
  }

  function cancelDecay() {
    if (shieldDecayTO) {
      clearTimeout(shieldDecayTO);
      shieldDecayTO = null;
    }
    setDecayActive(false);
    if (shieldEl) shieldEl.style.opacity = "";
  }

  function cancelFade() {
    if (shieldFadeTO) {
      clearTimeout(shieldFadeTO);
      shieldFadeTO = null;
    }
  }

  function setFade(v) {
    shieldFadeVal = clamp01(v);
    if (shieldEl) shieldEl.style.setProperty("--shield-fade", String(shieldFadeVal));
  }

  function off() {
    if (!shieldEl) return;
    cancelDecay();
    cancelFade();
    setFade(1);
    shieldEl.classList.remove("on");
    shieldEl.style.opacity = "";
    shieldEl.style.animation = "";
    shieldEl.style.width = "";
    shieldEl.style.height = "";
  }

  function on() {
    if (!shieldEl || typeof getConfig !== "function") return;
    cancelDecay();
    cancelFade();

    const cfg = getConfig() || {};
    const a = clamp(cfg.alpha, 0, 1);
    const pMax = Math.min(clamp(cfg.pulseMax, 0, 1), a);
    const pMin = clamp(cfg.pulseMin, 0, 1);
    const pMs = Math.round(clamp(cfg.pulseMs, 20, 700));

    if (typeof setCssVar === "function") {
      setCssVar("--shield-alpha", a.toFixed(2));
      setCssVar("--shield-pulse-ms", `${pMs}ms`);
      setCssVar("--shield-pulse-min", pMin.toFixed(2));
      setCssVar("--shield-pulse-max", pMax.toFixed(2));
    }

    if (!shieldEl.classList.contains("on")) {
      off();
      void shieldEl.offsetWidth;
      shieldEl.classList.add("on");
    }

    shieldEl.style.animation = "";
    shieldEl.style.transition = `filter ${Math.max(0, Number(fadeInMs) || 0)}ms linear`;
    requestAnimationFrame(() => setFade(1));
    shieldFadeTO = setTimeout(() => {
      shieldFadeTO = null;
      if (shieldEl) shieldEl.style.transition = "";
    }, Math.max(0, Number(fadeInMs) || 0));
  }

  function decay() {
    if (!shieldEl) return;
    if (shieldDecayTO) return;
    setDecayActive(true);
    shieldEl.style.animation = "";
    shieldEl.style.transition = `filter ${Math.max(0, Number(decayMs) || 0)}ms linear`;
    requestAnimationFrame(() => setFade(0));
    shieldDecayTO = setTimeout(() => {
      shieldDecayTO = null;
      setDecayActive(false);
      if (shieldEl) shieldEl.style.transition = "";
      off();
    }, Math.max(0, Number(decayMs) || 0));
  }

  function getState() {
    return {
      decayActive: !!shieldDecayActive,
      fade: Number(shieldFadeVal) || 0,
    };
  }

  function destroy() {
    off();
  }

  return {
    on,
    off,
    decay,
    cancelDecay,
    cancelFade,
    getState,
    destroy,
  };
}

