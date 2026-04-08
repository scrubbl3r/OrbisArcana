import { createTransmitterPageShell } from "./transmitter-page-shell.js";
import { createTransmitterUiBoot } from "./transmitter-ui-boot.js";

function loadLegacyTransmitterRuntime() {
  const script = document.createElement("script");
  script.src = "../../../mobile-transmitter.js";
  script.defer = true;
  script.dataset.entry = "transmitter-domain";
  document.body.appendChild(script);
}

window.__orbisTransmitterPageShell = createTransmitterPageShell({
  rootDocument: document,
});
window.__orbisTransmitterUiBoot = createTransmitterUiBoot({
  rootDocument: document,
});
window.__orbisTransmitterUiBoot.applyTheme();
window.__orbisTransmitterUiBoot.attachVersionTag();
window.__orbisTransmitterUiBoot.setBgFromEnergy(0);

loadLegacyTransmitterRuntime();
