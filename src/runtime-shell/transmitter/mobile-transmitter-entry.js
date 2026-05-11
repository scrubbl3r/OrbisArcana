import { createTransmitterPageShell } from "./transmitter-page-shell.js";
import { createTransmitterLifecycle } from "./transmitter-lifecycle.js";
import { createTransmitterSessionBootstrap } from "./transmitter-session-bootstrap.js";
import { createTransmitterMotionInput } from "./transmitter-motion-input.js";
import { createTransmitterPacketPublisher } from "./transmitter-packet-publisher.js?v=20260510b";
import { createTransmitterAudioRuntime } from "./transmitter-audio-runtime.js";
import { createTransmitterMotionCore } from "./transmitter-motion-core.js?v=20260510b";
import { createTransmitterRuntimeReset } from "./transmitter-runtime-reset.js";
import { createTransmitterLanSession } from "./transmitter-lan-session.js";
import { createTransmitterGestureLabUi } from "./gesture-lab/transmitter-gesture-lab-ui.js";
import { createTransmitterGestureLabLogic } from "./gesture-lab/transmitter-gesture-lab-logic.js";
import { createTransmitterCalibrationLogic } from "./gesture-lab/transmitter-calibration-logic.js";
import { createTransmitterUiBoot } from "./transmitter-ui-boot.js";
import { createTransmitterViewportBoot } from "./transmitter-viewport-boot.js";
import { createTransmitterGestureLabState } from "./gesture-lab/transmitter-gesture-lab-state.js";

function loadLegacyTransmitterRuntime() {
  const script = document.createElement("script");
  script.src = "../../../mobile-transmitter.js?v=20260510b";
  script.defer = true;
  script.dataset.entry = "transmitter-domain";
  document.body.appendChild(script);
}

window.__orbisTransmitterPageShell = createTransmitterPageShell({
  rootDocument: document,
});
window.__orbisTransmitterLifecycle = createTransmitterLifecycle({
  pageShell: window.__orbisTransmitterPageShell,
  startButton: window.__orbisTransmitterPageShell.refs.startBtn,
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
window.__orbisTransmitterMotionInput = createTransmitterMotionInput({
  rootWindow: window,
});
window.__orbisCreateTransmitterPacketPublisher = createTransmitterPacketPublisher;
window.__orbisTransmitterAudioRuntime = createTransmitterAudioRuntime({
  rootWindow: window,
  toneBaseHz: 180,
  toneMaxAddHz: 220,
  masterGain: 2.2,
});
window.__orbisCreateTransmitterMotionCore = createTransmitterMotionCore;
window.__orbisCreateTransmitterRuntimeReset = createTransmitterRuntimeReset;
window.__orbisCreateTransmitterLanSession = createTransmitterLanSession;
window.__orbisTransmitterGestureLabUi = createTransmitterGestureLabUi({
  rootDocument: document,
});
window.__orbisTransmitterGestureLabLogic = createTransmitterGestureLabLogic();
window.__orbisTransmitterCalibrationLogic = createTransmitterCalibrationLogic();
window.__orbisTransmitterGestureLabState = createTransmitterGestureLabState({
  rootStorage: localStorage,
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
