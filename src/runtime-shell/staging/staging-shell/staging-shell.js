import { createStagingShellRuntime } from "./create-staging-shell-runtime.js?v=20260520041000";
import { createShellBootStatusController } from "./shell-boot-status.js?v=20260408a";

globalThis.__orbisStagingShellEntryVersion = "20260519125620s";

const bootStatus = createShellBootStatusController({ rootDocument: document });

async function initStagingShell() {
  bootStatus.setStatus({
    phase: "js-loaded",
    detail: "staging-shell.js running",
    state: "booting",
  });
  try {
    await createStagingShellRuntime({ rootDocument: document, bootStatus });
    bootStatus.setStatus({
      phase: "runtime-ready",
      detail: "createStagingShellRuntime resolved",
      state: "ready",
    });
  } catch (error) {
    console.warn("[staging-shell] boot failed", error);
    bootStatus.setStatus({
      phase: "boot-failed",
      detail: error && error.message ? String(error.message) : "Unknown staging shell boot error",
      state: "failed",
    });
  }
}

initStagingShell();
