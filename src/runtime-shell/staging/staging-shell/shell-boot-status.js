export function createShellBootStatusController({
  rootDocument = document,
} = {}) {
  const docEl = rootDocument && rootDocument.documentElement;
  const banner = rootDocument && rootDocument.getElementById("shellBootBanner");
  const loader = rootDocument && rootDocument.getElementById("shellBootLoader");
  const phaseEl = rootDocument && rootDocument.getElementById("shellBootPhase");
  const detailEl = rootDocument && rootDocument.getElementById("shellBootDetail");
  const collapseBtn = rootDocument && rootDocument.getElementById("shellBootCollapse");
  const readyChip = rootDocument && rootDocument.getElementById("shellBootReadyChip");

  let collapsed = false;

  const phaseOrder = [
    "js-loaded",
    "booting",
    "shared-modules-ready",
    "local-stage-ready",
    "pairing-booting",
    "pairing-ready",
    "runtime-ready",
  ];

  function syncCollapsed() {
    if (banner) banner.dataset.collapsed = collapsed ? "true" : "false";
    if (collapseBtn) {
      collapseBtn.setAttribute("aria-expanded", collapsed ? "false" : "true");
      collapseBtn.setAttribute("aria-label", collapsed ? "Expand boot status" : "Collapse boot status");
      collapseBtn.textContent = collapsed ? "+" : "-";
    }
  }

  function setProgress(progress01) {
    if (!loader) return;
    const clamped = Math.max(0, Math.min(1, Number(progress01) || 0));
    loader.style.setProperty("--boot-progress", String(clamped));
  }

  function resolveProgress(phase, state) {
    if (state === "failed") return 1;
    if (state === "ready") return 1;
    const idx = phaseOrder.indexOf(String(phase || ""));
    if (idx === -1) return 0.08;
    return Math.max(0.08, (idx + 1) / phaseOrder.length);
  }

  function syncReadyChip(state) {
    if (!readyChip) return;
    readyChip.dataset.state = String(state || "booting");
    readyChip.hidden = String(state || "booting") !== "ready";
  }

  function setCollapsed(next) {
    collapsed = !!next;
    syncCollapsed();
  }

  function setStatus({ phase, detail, state = "booting" } = {}) {
    const normalizedState = String(state || "booting");
    if (docEl && phase) docEl.dataset.stagingShellBoot = String(phase);
    if (banner) banner.dataset.state = normalizedState;
    if (phaseEl && phase) phaseEl.textContent = String(phase);
    if (detailEl && detail) detailEl.textContent = String(detail);
    setProgress(resolveProgress(phase, normalizedState));
    syncReadyChip(normalizedState);

    if (normalizedState === "failed" || normalizedState === "booting") {
      setCollapsed(false);
      return;
    }
  }

  function destroy() {
    if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
    if (readyChip && readyChip.parentNode) readyChip.parentNode.removeChild(readyChip);
  }

  if (collapseBtn) {
    collapseBtn.addEventListener("click", () => {
      setCollapsed(!collapsed);
    });
  }

  syncReadyChip("booting");
  setProgress(0.08);
  syncCollapsed();

  return {
    setStatus,
    setCollapsed,
    destroy,
    isCollapsed() {
      return collapsed;
    },
  };
}
