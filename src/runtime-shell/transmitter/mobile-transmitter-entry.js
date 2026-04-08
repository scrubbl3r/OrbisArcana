import { createTransmitterPageShell } from "./transmitter-page-shell.js";
import { createTransmitterSessionBootstrap } from "./transmitter-session-bootstrap.js";
import { createTransmitterUiBoot } from "./transmitter-ui-boot.js";
import { createTransmitterViewportBoot } from "./transmitter-viewport-boot.js";

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
window.__orbisTransmitterSessionBootstrap = createTransmitterSessionBootstrap({
  rootWindow: window,
  ablyCtor: (typeof window.Ably !== "undefined" && window.Ably) ? window.Ably : null,
  tokenUrl: "https://orb-token.mrgarthwilliams.workers.dev/token",
  workerBase: "https://orb-token.mrgarthwilliams.workers.dev",
  lanStunServers: [{ urls: "stun:stun.l.google.com:19302" }],
  lanTokenTtlMs: 60 * 1000,
  setJoinStatus: (msg) => window.__orbisTransmitterPageShell.setJoinStatus(msg),
  hideLanConnecting: () => window.__orbisTransmitterPageShell.hideLanConnecting(),
  onCalibrate: () => {
    if (typeof window.__orbisStartTransmitterCalibration === "function") {
      window.__orbisStartTransmitterCalibration();
    }
  },
});
window.__orbisTransmitterUiBoot = createTransmitterUiBoot({
  rootDocument: document,
});
window.__orbisTransmitterViewportBoot = createTransmitterViewportBoot({
  rootWindow: window,
  rootDocument: document,
});
window.__orbisTransmitterUiBoot.applyTheme();
window.__orbisTransmitterUiBoot.attachVersionTag();
window.__orbisTransmitterUiBoot.setBgFromEnergy(0);
window.__orbisTransmitterViewportBoot.attach();

loadLegacyTransmitterRuntime();
