import { createShieldPreview } from "./previews/shield-preview.js?v=20260425d";
import { createBubbleShield3dPreview } from "./previews/bubble-shield-3d-preview.js?v=20260506d";
import { createShockwavePreview } from "./previews/shockwave-preview.js?v=20260425d";
import { createFlameAoePreview } from "./previews/flame-aoe-preview.js?v=20260425d";
import { createElectricAoePreview } from "./previews/electric-aoe-preview.js?v=20260425d";
import { createOrbBasePreview } from "./previews/orb-base-preview.js?v=20260425d";
import { createOrbTemplatePreview } from "./previews/orb-template-preview.js?v=20260425d";
import {
  createOrb3dPreview,
  readOrb3dPreviewConfig,
} from "./previews/orb-3d-preview.js?v=20260428a";
import { createOrbSpawnPreview } from "./previews/orb-spawn-preview.js?v=20260501a";
import { createOrbNod3dPreview } from "./previews/orb-nod3d-preview.js?v=20260428b";
import { createOrbLifecyclePreview } from "./previews/orb-lifecycle-preview.js?v=20260425d";
import { createOrbLifecycle3dPreview } from "./previews/orb-lifecycle-3d-preview.js?v=20260430a";
import { createOrbGlobe3dPreview } from "./previews/orb-globe-3d-preview.js?v=20260504g";
import { createOrbGlobePreview } from "./previews/orb-globe-preview.js?v=20260425d";
import { createWorldGlobe3dPreview } from "./previews/world-globe-3d-preview.js?v=20260502b";
import { createWorldGlobePreview } from "./previews/world-globe-preview.js?v=20260425d";
import { createOrbTeleportPreview } from "./previews/orb-teleport-preview.js?v=20260425d";
import { createOrbTeleport3dPreview } from "./previews/orb-teleport-3d-preview.js?v=20260501a";
import { createFlameAoe3dPreview } from "./previews/flame-aoe-3d-preview.js?v=20260505f";
import { createBankOrb3dPreview } from "./previews/bank-orb-3d-preview.js?v=20260502a";

export function createStudioPreviewRegistry({
  els,
  GEOM,
  clamp,
  evenPx,
  clampByte,
  createScopedVarSetter,
  previewEls,
  defaults,
  getOrbBaseVisualState,
  getOrb3dVisualSettings,
  onOrbBaseVisualStateApplied,
  previewRootsByEffect,
  updateTeleportBehaviorReadout = null,
} = {}) {
  const actions = {};

  const shieldPreview = createShieldPreview({
    els: previewEls.shield,
    GEOM,
    clamp,
    evenPx,
    setVar: createScopedVarSetter(els.shieldPreviewRoot),
  });
  actions.applyShieldGeometry = shieldPreview.applyGeometry;
  actions.applyShield = shieldPreview.apply;
  actions.applyPulse = shieldPreview.applyPulse;
  actions.shieldOffNow = shieldPreview.clear;
  actions.playShield = shieldPreview.play;
  shieldPreview.wire();

  const bubbleShield3dPreview = createBubbleShield3dPreview({
    els: previewEls.bubbleShield3d,
    getOrbBaseVisualState,
    getOrb3dVisualSettings: getOrb3dVisualSettings || (() => readOrb3dPreviewConfig(previewEls.orb3d)),
  });
  actions.applyBubbleShield3d = bubbleShield3dPreview.apply;
  actions.clearBubbleShield3d = bubbleShield3dPreview.clear;
  actions.playBubbleShield3d = bubbleShield3dPreview.play;
  bubbleShield3dPreview.wire();

  const shockwavePreview = createShockwavePreview({
    els: previewEls.shock,
    clamp,
    setVar: createScopedVarSetter(els.shockPreviewRoot),
    shockwavePresetDefault: defaults.shockwavePresetDefault,
  });
  actions.applyShock = shockwavePreview.apply;
  actions.clearShock = shockwavePreview.clear;
  actions.playShock = shockwavePreview.play;
  shockwavePreview.wire();

  const flamePreview = createFlameAoePreview({
    els: previewEls.flame,
    clamp,
    evenPx,
    setVar: createScopedVarSetter(els.flamePreviewRoot),
    flamePresetDefault: defaults.flamePresetDefault,
  });
  actions.applyFlameControls = flamePreview.apply;
  actions.clearFlame = flamePreview.clear;
  actions.playFlame = flamePreview.play;
  flamePreview.wire();

  const electricPreview = createElectricAoePreview({
    els: previewEls.electric,
    clamp,
    evenPx,
    setVar: createScopedVarSetter(els.electricPreviewRoot),
    electricPresetDefault: defaults.electricPresetDefault,
  });
  actions.applyElectricControls = electricPreview.apply;
  actions.clearElectric = electricPreview.clear;
  actions.playElectric = electricPreview.play;
  electricPreview.wire();

  const orbBasePreview = createOrbBasePreview({
    els: {
      ...previewEls.orbBase,
      onApply: (visualState) => {
        if (typeof onOrbBaseVisualStateApplied === "function") {
          onOrbBaseVisualStateApplied(visualState, actions);
        }
      },
    },
    evenPx,
    clamp,
    clampByte,
  });
  actions.applyOrbBase = orbBasePreview.apply;
  orbBasePreview.wire();

  const orbTemplatePreview = createOrbTemplatePreview({
    els: previewEls.orbTemplate,
    getOrbBaseVisualState,
  });
  actions.applyOrbTemplate = orbTemplatePreview.apply;
  actions.clearOrbTemplate = orbTemplatePreview.clear;

  const orb3dPreview = createOrb3dPreview({
    els: previewEls.orb3d,
    getOrbBaseVisualState,
  });
  actions.applyOrb3d = orb3dPreview.apply;
  actions.clearOrb3d = orb3dPreview.clear;
  orb3dPreview.wire();

  const orbSpawnPreview = createOrbSpawnPreview({
    els: previewEls.orbSpawn,
    getOrbBaseVisualState,
    getOrb3dVisualSettings: getOrb3dVisualSettings || (() => readOrb3dPreviewConfig(previewEls.orb3d)),
  });
  actions.applyOrbSpawn = orbSpawnPreview.apply;
  actions.clearOrbSpawn = orbSpawnPreview.clear;
  orbSpawnPreview.wire();

  const orbNodPreview = createOrbTemplatePreview({
    els: previewEls.orbNod,
    getOrbBaseVisualState,
  });
  actions.applyOrbNod = orbNodPreview.apply;
  actions.clearOrbNod = orbNodPreview.clear;
  orbNodPreview.wire();

  const orbNod3dPreview = createOrbNod3dPreview({
    els: previewEls.orbNod3d,
    getOrbBaseVisualState,
    getOrb3dVisualSettings: getOrb3dVisualSettings || (() => readOrb3dPreviewConfig(previewEls.orb3d)),
  });
  actions.applyOrbNod3d = orbNod3dPreview.apply;
  actions.clearOrbNod3d = orbNod3dPreview.clear;
  actions.playOrbNod3d = orbNod3dPreview.play;
  orbNod3dPreview.wire();

  const orbLifecyclePreview = createOrbLifecyclePreview({ els: previewEls.orbLifecycle });
  actions.applyOrbLifecycle = orbLifecyclePreview.apply;
  actions.clearOrbLifecycle = orbLifecyclePreview.clear;
  orbLifecyclePreview.wire();

  const orbLifecycle3dPreview = createOrbLifecycle3dPreview({
    els: previewEls.orbLifecycle3d,
    getOrbBaseVisualState,
  });
  actions.applyOrbLifecycle3d = orbLifecycle3dPreview.apply;
  actions.clearOrbLifecycle3d = orbLifecycle3dPreview.clear;
  orbLifecycle3dPreview.wire();

  const orbGlobePreview = createOrbGlobePreview({
    els: previewEls.orbGlobe,
    clamp,
  });
  actions.applyOrbGlobe = orbGlobePreview.apply;
  actions.clearOrbGlobe = orbGlobePreview.clear;
  orbGlobePreview.wire();

  const orbGlobe3dPreview = createOrbGlobe3dPreview({
    els: previewEls.orbGlobe3d,
    getOrbBaseVisualState,
  });
  actions.applyOrbGlobe3d = orbGlobe3dPreview.apply;
  actions.clearOrbGlobe3d = orbGlobe3dPreview.clear;
  orbGlobe3dPreview.wire();

  const worldGlobePreview = createWorldGlobePreview({
    els: previewEls.worldGlobe,
    clamp,
  });
  actions.applyWorldGlobe = worldGlobePreview.apply;
  actions.clearWorldGlobe = worldGlobePreview.clear;
  worldGlobePreview.wire();

  const worldGlobe3dPreview = createWorldGlobe3dPreview({
    els: previewEls.worldGlobe3d,
  });
  actions.applyWorldGlobe3d = worldGlobe3dPreview.apply;
  actions.clearWorldGlobe3d = worldGlobe3dPreview.clear;
  worldGlobe3dPreview.wire();

  const orbTeleportPreview = createOrbTeleportPreview({
    els: previewEls.orbTeleport,
    getOrbBaseVisualState,
  });
  actions.applyOrbTeleport = orbTeleportPreview.apply;
  actions.clearOrbTeleport = orbTeleportPreview.clear;
  actions.playOrbTeleport = orbTeleportPreview.play;
  orbTeleportPreview.wire();

  const orbTeleport3dPreview = createOrbTeleport3dPreview({
    els: previewEls.orbTeleport3d,
    getOrbBaseVisualState,
    getOrb3dVisualSettings: getOrb3dVisualSettings || (() => readOrb3dPreviewConfig(previewEls.orb3d)),
  });
  actions.applyOrbTeleport3d = orbTeleport3dPreview.apply;
  actions.clearOrbTeleport3d = orbTeleport3dPreview.clear;
  actions.playOrbTeleport3d = orbTeleport3dPreview.play;
  orbTeleport3dPreview.wire();

  const flameAoe3dPreview = createFlameAoe3dPreview({
    els: previewEls.flameAoe3d,
    getOrbBaseVisualState,
    getOrb3dVisualSettings: getOrb3dVisualSettings || (() => readOrb3dPreviewConfig(previewEls.orb3d)),
  });
  actions.applyFlameAoe3d = flameAoe3dPreview.apply;
  actions.clearFlameAoe3d = flameAoe3dPreview.clear;
  actions.playFlameAoe3d = flameAoe3dPreview.play;
  flameAoe3dPreview.wire();

  const bankOrb3dPreview = createBankOrb3dPreview({
    els: previewEls.bankOrb3d,
    getOrbBaseVisualState,
    getOrb3dVisualSettings: getOrb3dVisualSettings || (() => readOrb3dPreviewConfig(previewEls.orb3d)),
  });
  actions.applyBankOrb3d = bankOrb3dPreview.apply;
  actions.clearBankOrb3d = bankOrb3dPreview.clear;
  actions.playBankOrb3d = bankOrb3dPreview.play;
  bankOrb3dPreview.wire();

  function stopAllStudioEffects() {
    if (typeof actions.shieldOffNow === "function") actions.shieldOffNow();
    if (typeof actions.clearShock === "function") actions.clearShock();
    if (typeof actions.clearFlame === "function") actions.clearFlame();
    if (typeof actions.clearElectric === "function") actions.clearElectric();
    if (typeof actions.clearOrbTemplate === "function") actions.clearOrbTemplate();
    if (typeof actions.clearOrb3d === "function") actions.clearOrb3d();
    if (typeof actions.clearOrbSpawn === "function") actions.clearOrbSpawn();
    if (typeof actions.clearOrbNod === "function") actions.clearOrbNod();
    if (typeof actions.clearOrbNod3d === "function") actions.clearOrbNod3d();
    if (typeof actions.clearOrbLifecycle === "function") actions.clearOrbLifecycle();
    if (typeof actions.clearOrbLifecycle3d === "function") actions.clearOrbLifecycle3d();
    if (typeof actions.clearOrbGlobe === "function") actions.clearOrbGlobe();
    if (typeof actions.clearOrbGlobe3d === "function") actions.clearOrbGlobe3d();
    if (typeof actions.clearWorldGlobe === "function") actions.clearWorldGlobe();
    if (typeof actions.clearWorldGlobe3d === "function") actions.clearWorldGlobe3d();
    if (typeof actions.clearOrbTeleport === "function") actions.clearOrbTeleport();
    if (typeof actions.clearOrbTeleport3d === "function") actions.clearOrbTeleport3d();
    if (typeof actions.clearFlameAoe3d === "function") actions.clearFlameAoe3d();
    if (typeof actions.clearBankOrb3d === "function") actions.clearBankOrb3d();
    Object.values(previewRootsByEffect || {}).forEach((root) => {
      if (!root || typeof root.setAttribute !== "function") return;
      root.setAttribute("aria-hidden", "true");
      root.toggleAttribute("hidden", true);
    });
  }

  if (typeof updateTeleportBehaviorReadout === "function") {
    if (els.applyTeleportBehaviorBtn) {
      els.applyTeleportBehaviorBtn.addEventListener("click", () => {
        updateTeleportBehaviorReadout();
        actions.applyOrbTeleport();
      });
    }
    if (els.previewTeleportBehaviorBtn) {
      els.previewTeleportBehaviorBtn.addEventListener("click", () => {
        updateTeleportBehaviorReadout();
        actions.playOrbTeleport();
      });
    }
    [
      els.orbTeleportFadeOutMs,
      els.orbTeleportCameraTravelMs,
      els.orbTeleportFadeInMs,
      els.orbTeleport3dFadeOutMs,
      els.orbTeleport3dCameraTravelMs,
      els.orbTeleport3dFadeInMs,
    ].forEach((field) => {
      if (field) field.addEventListener("input", updateTeleportBehaviorReadout);
    });
    [
      els.orbTeleportApplyFadeOutBtn,
      els.orbTeleportApplyCameraTravelBtn,
      els.orbTeleportApplyFadeInBtn,
      els.orbTeleport3dApplyFadeOutBtn,
      els.orbTeleport3dApplyCameraTravelBtn,
      els.orbTeleport3dApplyFadeInBtn,
    ].forEach((btn) => {
      if (btn) btn.addEventListener("click", updateTeleportBehaviorReadout);
    });
    if (els.applyTeleport3dBehaviorBtn) {
      els.applyTeleport3dBehaviorBtn.addEventListener("click", () => {
        updateTeleportBehaviorReadout();
        actions.applyOrbTeleport3d();
      });
    }
    if (els.previewTeleport3dBehaviorBtn) {
      els.previewTeleport3dBehaviorBtn.addEventListener("click", () => {
        updateTeleportBehaviorReadout();
        actions.playOrbTeleport3d();
      });
    }
  }

  return Object.freeze({
    actions: Object.freeze(actions),
    stopAllStudioEffects,
  });
}
