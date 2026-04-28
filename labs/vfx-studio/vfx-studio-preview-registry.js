import { createShieldPreview } from "./previews/shield-preview.js?v=20260425d";
import { createShockwavePreview } from "./previews/shockwave-preview.js?v=20260425d";
import { createFlameAoePreview } from "./previews/flame-aoe-preview.js?v=20260425d";
import { createElectricAoePreview } from "./previews/electric-aoe-preview.js?v=20260425d";
import { createOrbBasePreview } from "./previews/orb-base-preview.js?v=20260425d";
import { createOrbTemplatePreview } from "./previews/orb-template-preview.js?v=20260425d";
import { createOrbNod3dPreview } from "./previews/orb-nod3d-preview.js?v=20260427b";
import { createOrbLifecyclePreview } from "./previews/orb-lifecycle-preview.js?v=20260425d";
import { createOrbGlobePreview } from "./previews/orb-globe-preview.js?v=20260425d";
import { createWorldGlobePreview } from "./previews/world-globe-preview.js?v=20260425d";
import { createOrbTeleportPreview } from "./previews/orb-teleport-preview.js?v=20260425d";

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
  });
  actions.applyOrbNod3d = orbNod3dPreview.apply;
  actions.clearOrbNod3d = orbNod3dPreview.clear;
  actions.playOrbNod3d = orbNod3dPreview.play;
  orbNod3dPreview.wire();

  const orbLifecyclePreview = createOrbLifecyclePreview({ els: previewEls.orbLifecycle });
  actions.applyOrbLifecycle = orbLifecyclePreview.apply;
  actions.clearOrbLifecycle = orbLifecyclePreview.clear;
  orbLifecyclePreview.wire();

  const orbGlobePreview = createOrbGlobePreview({
    els: previewEls.orbGlobe,
    clamp,
  });
  actions.applyOrbGlobe = orbGlobePreview.apply;
  actions.clearOrbGlobe = orbGlobePreview.clear;
  orbGlobePreview.wire();

  const worldGlobePreview = createWorldGlobePreview({
    els: previewEls.worldGlobe,
    clamp,
  });
  actions.applyWorldGlobe = worldGlobePreview.apply;
  actions.clearWorldGlobe = worldGlobePreview.clear;
  worldGlobePreview.wire();

  const orbTeleportPreview = createOrbTeleportPreview({
    els: previewEls.orbTeleport,
    getOrbBaseVisualState,
  });
  actions.applyOrbTeleport = orbTeleportPreview.apply;
  actions.clearOrbTeleport = orbTeleportPreview.clear;
  actions.playOrbTeleport = orbTeleportPreview.play;
  orbTeleportPreview.wire();

  function stopAllStudioEffects() {
    if (typeof actions.shieldOffNow === "function") actions.shieldOffNow();
    if (typeof actions.clearShock === "function") actions.clearShock();
    if (typeof actions.clearFlame === "function") actions.clearFlame();
    if (typeof actions.clearElectric === "function") actions.clearElectric();
    if (typeof actions.clearOrbTemplate === "function") actions.clearOrbTemplate();
    if (typeof actions.clearOrbNod === "function") actions.clearOrbNod();
    if (typeof actions.clearOrbNod3d === "function") actions.clearOrbNod3d();
    if (typeof actions.clearOrbLifecycle === "function") actions.clearOrbLifecycle();
    if (typeof actions.clearOrbGlobe === "function") actions.clearOrbGlobe();
    if (typeof actions.clearWorldGlobe === "function") actions.clearWorldGlobe();
    if (typeof actions.clearOrbTeleport === "function") actions.clearOrbTeleport();
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
    ].forEach((field) => {
      if (field) field.addEventListener("input", updateTeleportBehaviorReadout);
    });
    [
      els.orbTeleportApplyFadeOutBtn,
      els.orbTeleportApplyCameraTravelBtn,
      els.orbTeleportApplyFadeInBtn,
    ].forEach((btn) => {
      if (btn) btn.addEventListener("click", updateTeleportBehaviorReadout);
    });
  }

  return Object.freeze({
    actions: Object.freeze(actions),
    stopAllStudioEffects,
  });
}
