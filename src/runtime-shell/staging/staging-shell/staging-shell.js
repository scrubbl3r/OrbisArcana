import { renderDevStaging } from "../dev-staging/dev-staging.js";
import { renderGameStaging } from "../game-staging/game-staging.js";

const SHELL_STATUS = Object.freeze({
  splitPrototype: "split-prototype",
});

function initStagingShell() {
  document.documentElement.dataset.stagingShell = SHELL_STATUS.splitPrototype;

  const devRoot = document.getElementById("devStagingMount");
  const gameRoot = document.getElementById("gameStagingMount");

  if (devRoot) renderDevStaging(devRoot);
  if (gameRoot) renderGameStaging(gameRoot);
}

initStagingShell();
