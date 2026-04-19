import {
  getLabStudioPaneLabel,
  listLabStudioSurfacePanes,
  surfaceSupportsLabStudioPane,
} from "./vfx-studio-panes.js";
import { updateEffectSections as updateEffectSectionsHelper } from "./vfx-studio-shell.js";

export function createStudioSurfaceActivation({
  els,
  surfaces,
  liveBehaviorModulesByBaseEffect,
  autoPreviewActions,
  selectedEffectOption,
  selectedBaseEffect,
  stopAllStudioEffects,
  lastSelectedEffectValueRef,
  draftStore,
  applyDraftToSelectedProfile,
  persistDraftStore,
  refreshEffectMeta,
  previewRootsByEffect,
  alignBindingTargetToSelectedEffect,
  refreshBindingPanel,
  updateBehaviorReadout,
  requestAnimationFrame: requestAnimationFrameImpl = requestAnimationFrame,
  behaviorSectionSelector = ".behaviorSection[data-behavior-effect]",
} = {}) {
  let activeAuthoringPane = "vfx";

  function selectedEffectSurface() {
    return (surfaces && surfaces[String(selectedBaseEffect() || "")]) || null;
  }

  function supportedPanesForSelectedEffect() {
    return listLabStudioSurfacePanes(selectedEffectSurface());
  }

  function refreshAuthoringPaneUi() {
    const supportedPanes = supportedPanesForSelectedEffect();
    const nextPane = supportedPanes.includes(activeAuthoringPane) ? activeAuthoringPane : (supportedPanes[0] || "vfx");
    activeAuthoringPane = nextPane;
    const showBehavior = nextPane === "behavior";

    if (els && els.vfxTabBtn) {
      const supportsVfx = supportedPanes.includes("vfx");
      els.vfxTabBtn.hidden = !supportsVfx;
      els.vfxTabBtn.disabled = !supportsVfx;
      els.vfxTabBtn.textContent = getLabStudioPaneLabel("vfx");
      els.vfxTabBtn.classList.toggle("active", supportsVfx && !showBehavior);
      els.vfxTabBtn.setAttribute("aria-selected", supportsVfx && !showBehavior ? "true" : "false");
    }
    if (els && els.behaviorTabBtn) {
      const supportsBehavior = supportedPanes.includes("behavior");
      els.behaviorTabBtn.hidden = !supportsBehavior;
      els.behaviorTabBtn.disabled = !supportsBehavior;
      els.behaviorTabBtn.textContent = getLabStudioPaneLabel("behavior");
      els.behaviorTabBtn.classList.toggle("active", supportsBehavior && showBehavior);
      els.behaviorTabBtn.setAttribute("aria-selected", supportsBehavior && showBehavior ? "true" : "false");
    }
    if (els && els.vfxAuthoringPanel) els.vfxAuthoringPanel.hidden = !supportedPanes.includes("vfx") || showBehavior;
    if (els && els.behaviorAuthoringPanel) els.behaviorAuthoringPanel.hidden = !supportedPanes.includes("behavior") || !showBehavior;
  }

  function setAuthoringTab(tabName) {
    const nextPane = String(tabName || "").trim().toLowerCase();
    const supportedPanes = supportedPanesForSelectedEffect();
    activeAuthoringPane = supportedPanes.includes(nextPane) ? nextPane : (supportedPanes[0] || "vfx");
    refreshAuthoringPaneUi();
  }

  function selectedBehaviorEffect() {
    const opt = typeof selectedEffectOption === "function" ? selectedEffectOption() : null;
    const baseEffect = String((opt && opt.dataset && opt.dataset.baseEffect) || (opt && opt.value) || "").trim().toLowerCase();
    if (liveBehaviorModulesByBaseEffect && liveBehaviorModulesByBaseEffect[baseEffect]) return baseEffect;
    return "";
  }

  function updateBehaviorSections() {
    if (!surfaceSupportsLabStudioPane(selectedEffectSurface(), "behavior")) {
      document.querySelectorAll(behaviorSectionSelector).forEach((section) => {
        section.hidden = section.getAttribute("data-behavior-effect") !== "default";
      });
      return;
    }
    const effect = selectedBehaviorEffect();
    const hasBehaviorSurface = !!effect;
    document.querySelectorAll(behaviorSectionSelector).forEach((section) => {
      const target = section.getAttribute("data-behavior-effect");
      section.hidden = hasBehaviorSurface ? target !== effect : target !== "default";
    });
    if (effect && typeof updateBehaviorReadout === "function") updateBehaviorReadout(effect);
  }

  function autoPreviewSelectedEffect() {
    try {
      const surface = selectedEffectSurface();
      const action = surface && surface.autoPreviewKey ? autoPreviewActions[surface.autoPreviewKey] : null;
      if (typeof action === "function") action();
    } catch (err) {
      console.error("autoPreviewSelectedEffect failed", err);
    }
  }

  function updateEffectSections() {
    const result = updateEffectSectionsHelper({
      selectedEffectOption,
      stopAllStudioEffects,
      lastSelectedEffectValueRef,
      selectedBaseEffect,
      draftStore,
      applyDraftToSelectedProfile,
      persistDraftStore,
      refreshEffectMeta,
      previewRootsByEffect,
    });
    if (typeof alignBindingTargetToSelectedEffect === "function") alignBindingTargetToSelectedEffect();
    if (typeof refreshBindingPanel === "function") refreshBindingPanel();
    refreshAuthoringPaneUi();
    updateBehaviorSections();
    requestAnimationFrameImpl(autoPreviewSelectedEffect);
    return result;
  }

  function settleSelectedEffectState() {
    const result = updateEffectSections();
    requestAnimationFrameImpl(() => {
      if (typeof alignBindingTargetToSelectedEffect === "function") alignBindingTargetToSelectedEffect();
      if (typeof refreshBindingPanel === "function") refreshBindingPanel();
      updateBehaviorSections();
      autoPreviewSelectedEffect();
    });
    return result;
  }

  function bindPaneEvents() {
    if (els && els.vfxTabBtn) els.vfxTabBtn.addEventListener("click", () => setAuthoringTab("vfx"));
    if (els && els.behaviorTabBtn) els.behaviorTabBtn.addEventListener("click", () => setAuthoringTab("behavior"));
    if (els && els.bindingTargetSelect) els.bindingTargetSelect.addEventListener("change", updateBehaviorSections);
  }

  return Object.freeze({
    autoPreviewSelectedEffect,
    bindPaneEvents,
    refreshAuthoringPaneUi,
    selectedBehaviorEffect,
    selectedEffectSurface,
    setAuthoringTab,
    settleSelectedEffectState,
    supportedPanesForSelectedEffect,
    updateBehaviorSections,
    updateEffectSections,
  });
}
