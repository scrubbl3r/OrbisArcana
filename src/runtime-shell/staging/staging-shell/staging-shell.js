import { createStagingShellRuntime } from "./create-staging-shell-runtime.js?v=20260331o";

function setBootBanner({ phase, detail, state = "booting" } = {}) {
  const banner = document.getElementById("shellBootBanner");
  const phaseEl = document.getElementById("shellBootPhase");
  const detailEl = document.getElementById("shellBootDetail");
  if (banner) banner.dataset.state = state;
  if (phaseEl && phase) phaseEl.textContent = String(phase);
  if (detailEl && detail) detailEl.textContent = String(detail);
}

async function initStagingShell() {
  setBootBanner({
    phase: "js-loaded",
    detail: "staging-shell.js running",
    state: "booting",
  });
  try {
    await createStagingShellRuntime({ rootDocument: document });
    setBootBanner({
      phase: "runtime-ready",
      detail: "createStagingShellRuntime resolved",
      state: "ready",
    });
  } catch (error) {
    console.warn("[staging-shell] boot failed", error);
    setBootBanner({
      phase: "boot-failed",
      detail: error && error.message ? String(error.message) : "Unknown staging shell boot error",
      state: "failed",
    });
  }
}

initStagingShell();
