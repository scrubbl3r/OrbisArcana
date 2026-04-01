import { createStagingShellRuntime } from "./create-staging-shell-runtime.js";

async function initStagingShell() {
  try {
    await createStagingShellRuntime({ rootDocument: document });
  } catch (error) {
    console.warn("[staging-shell] boot failed", error);
  }
}

initStagingShell();
