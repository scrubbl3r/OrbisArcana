import { renderDevStagingHud, resetDevStagingHud } from "./dev-staging-hud.js?v=20260510c";
import { createInputHudPanelRefs } from "./input-hud-panel-refs.js?v=20260511a";
import { INPUT_HUD_PANEL_TEMPLATE } from "./input-hud-panel-template.js?v=20260511b";

const LIFT_MIXER_KEYS = ["groove", "smooth", "speed"];
const LIFT_MIXER_INPUT_REFS = {
  groove: "liftMixerGroove",
  smooth: "liftMixerSmooth",
  speed: "liftMixerSpeed",
};

function clampPercent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function formatPercent(value) {
  const rounded = Math.round(clampPercent(value) * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function normalizePercentWeights(weights = {}) {
  const groove = clampPercent(Number(weights.groove) * 100);
  const smooth = clampPercent(Number(weights.smooth) * 100);
  const speed = clampPercent(Number(weights.speed) * 100);
  const total = groove + smooth + speed;
  if (total > 0) {
    return {
      groove: (groove / total) * 100,
      smooth: (smooth / total) * 100,
      speed: (speed / total) * 100,
    };
  }
  return { groove: 33.33, smooth: 33.33, speed: 33.34 };
}

function percentWeightSignature(weights = {}) {
  const normalized = normalizePercentWeights(weights);
  return LIFT_MIXER_KEYS.map((key) => formatPercent(normalized[key])).join("|");
}

function mountLiftMixer(refs, {
  initialWeights = null,
  onChange = null,
} = {}) {
  if (!refs) return null;
  const inputs = Object.fromEntries(
    LIFT_MIXER_KEYS.map((key) => [key, refs[LIFT_MIXER_INPUT_REFS[key]] || null])
  );
  if (!inputs.groove || !inputs.smooth || !inputs.speed) return null;

  let manualKeys = ["groove", "smooth"];
  let values = normalizePercentWeights(initialWeights || {});
  let externalSignature = percentWeightSignature(values);
  let updating = false;

  function derivedKey() {
    return LIFT_MIXER_KEYS.find((key) => !manualKeys.includes(key)) || "speed";
  }

  function publish() {
    if (typeof onChange !== "function") return;
    externalSignature = percentWeightSignature({
      groove: values.groove / 100,
      smooth: values.smooth / 100,
      speed: values.speed / 100,
    });
    onChange({
      groove: values.groove / 100,
      smooth: values.smooth / 100,
      speed: values.speed / 100,
    });
  }

  function render() {
    updating = true;
    const autoKey = derivedKey();
    for (const key of LIFT_MIXER_KEYS) {
      const input = inputs[key];
      input.value = formatPercent(values[key]);
      input.classList.toggle("isAuto", key === autoKey);
      input.title = key === autoKey ? "Auto-derived to keep the lift mixer at 100" : "";
    }
    updating = false;
  }

  function solve(activeKey) {
    manualKeys = manualKeys.filter((key) => key !== activeKey);
    manualKeys.push(activeKey);
    while (manualKeys.length > 2) manualKeys.shift();

    const otherManualKey = manualKeys.find((key) => key !== activeKey);
    const activeMax = Math.max(0, 100 - (Number(values[otherManualKey]) || 0));
    values[activeKey] = Math.min(values[activeKey], activeMax);

    const autoKey = derivedKey();
    values[autoKey] = Math.max(0, 100 - manualKeys.reduce((sum, key) => sum + (Number(values[key]) || 0), 0));
    render();
    publish();
  }

  for (const key of LIFT_MIXER_KEYS) {
    inputs[key].addEventListener("input", () => {
      if (updating) return;
      values[key] = clampPercent(inputs[key].value);
      solve(key);
    });
  }

  render();
  publish();
  return {
    getValues: () => ({ ...values }),
    syncExternal(nextWeights = {}) {
      const nextSignature = percentWeightSignature(nextWeights);
      if (nextSignature === externalSignature) return;
      values = normalizePercentWeights(nextWeights);
      externalSignature = nextSignature;
      render();
    },
  };
}

export function mountInputHudPanel(host, {
  onRequestClose = null,
  liftMixerWeights = null,
  getLiftMixerWeights = null,
  onLiftMixerChange = null,
} = {}) {
  if (!host) return null;
  host.innerHTML = INPUT_HUD_PANEL_TEMPLATE;
  const refs = createInputHudPanelRefs(host);
  const liftMixer = mountLiftMixer(refs, {
    initialWeights: liftMixerWeights,
    onChange: onLiftMixerChange,
  });
  if (refs.dynamicsPanelClose) {
    refs.dynamicsPanelClose.addEventListener("click", () => {
      if (typeof onRequestClose === "function") onRequestClose();
    });
  }

  return {
    host,
    refs,
    liftMixer,
    render(vm) {
      if (liftMixer && typeof liftMixer.syncExternal === "function" && typeof getLiftMixerWeights === "function") {
        liftMixer.syncExternal(getLiftMixerWeights());
      }
      renderDevStagingHud(refs, vm);
    },
    reset() {
      resetDevStagingHud(refs);
    },
    unmount() {
      host.innerHTML = "";
    },
  };
}
