export async function bootstrapShellPairingRuntime({
  shellContext = null,
  workerBase = "",
  updateBootUi = () => {},
  bootStatus = {},
  stagingMobilePageBaseUrl = () => "",
  syncStartQrSize = () => 0,
  handleImpulseFrame = () => {},
  formatPhoneImpulseLogLine = () => "",
  onVoiceModeOpenWorld = () => {},
} = {}) {
  const rootDocument = shellContext && shellContext.rootDocument ? shellContext.rootDocument : null;
  if (!rootDocument) return null;

  const win = rootDocument.defaultView;
  const devView = shellContext.views && shellContext.views.devStagingView ? shellContext.views.devStagingView : null;
  const shellKws = shellContext.runtime && shellContext.runtime.kws ? shellContext.runtime.kws : null;
  const statusSet = (html, cls = "devStagingDim") => {
    if (devView && typeof devView.setStatus === "function") {
      devView.setStatus(html, cls);
    }
  };

  const startScreenEl = rootDocument.getElementById("startScreen");
  const startQr = rootDocument.getElementById("startQr");
  const calibOverlayEl = rootDocument.getElementById("calibOverlay");
  const calibBtnEl = rootDocument.getElementById("calibBtn");
  const calibStatusEl = rootDocument.getElementById("calibStatus");
  const shellBootReadyChip = rootDocument.getElementById("shellBootReadyChip");
  const shellOnboardingOverlay = rootDocument.getElementById("shellOnboardingOverlay");

  let calibInFlight = false;
  let calibAvailable = false;
  let uiOverlaysSystem = null;
  let mobileImpulseSystem = null;
  let lanSession = null;

  updateBootUi(rootDocument, bootStatus.pairingBooting, "Loading pairing systems");

  const { createUiOverlaysSystem } = await import("../../../ui/game/ui-overlays-system.js");
  const { createMobileImpulseSystem } = await import("../../receiver/mobile-impulse-runtime.js");
  const { createLanSessionSystem } = await import("../../session/lan-session.js");

  uiOverlaysSystem = createUiOverlaysSystem({
    startScreenEl,
    calibOverlayEl,
    calibBtnEl,
    calibStatusEl,
    deathPanelEl: shellContext.stageEls.deathPanel,
    onCalibClosed: () => {
      calibInFlight = false;
    },
  });

  const openCalibOverlay = () => uiOverlaysSystem.openCalibOverlay(calibAvailable);
  const closeCalibOverlay = () => uiOverlaysSystem.closeCalibOverlay();
  const setCalibStatus = (msg) => uiOverlaysSystem.setCalibStatus(msg);
  const hideStartScreen = () => uiOverlaysSystem.hideStartScreen();
  const showStartScreen = () => {
    if (!startScreenEl) return;
    startScreenEl.classList.remove("off");
    startScreenEl.setAttribute("aria-hidden", "false");
  };
  const destroyStartScreen = () => {
    if (!startScreenEl || !startScreenEl.parentNode) return;
    startScreenEl.parentNode.removeChild(startScreenEl);
  };
  const destroyCalibOverlay = () => {
    if (!calibOverlayEl || !calibOverlayEl.parentNode) return;
    calibOverlayEl.parentNode.removeChild(calibOverlayEl);
  };
  const destroyBootArtifacts = () => {
    if (shellContext && shellContext.bootStatus && typeof shellContext.bootStatus.destroy === "function") {
      shellContext.bootStatus.destroy();
      return;
    }
    if (shellBootReadyChip && shellBootReadyChip.parentNode) {
      shellBootReadyChip.parentNode.removeChild(shellBootReadyChip);
    }
  };
  const destroyOnboardingOverlay = () => {
    if (!shellOnboardingOverlay || !shellOnboardingOverlay.parentNode) return;
    shellOnboardingOverlay.parentNode.removeChild(shellOnboardingOverlay);
  };

  mobileImpulseSystem = createMobileImpulseSystem({
    idleMarkActivity: () => {},
    applyDataToUI: (data) => {
      handleImpulseFrame(data);
    },
    teleMaybeLog: (data) => {
      const kwsPanelController = shellKws && shellKws.kwsPanelController;
      if (!kwsPanelController || typeof kwsPanelController.pushPhoneLogLine !== "function") return;
      const line = formatPhoneImpulseLogLine(data);
      if (!line) return;
      kwsPanelController.pushPhoneLogLine(line, "muted");
    },
    onCalibrated: () => {
      setCalibStatus("Calibrated");
      closeCalibOverlay();
      destroyCalibOverlay();
      destroyOnboardingOverlay();
      statusSet('Phone calibrated <span class="devStagingDim">(staging shell)</span>', "devStagingDim");
      onVoiceModeOpenWorld();
    },
    onCalibAvailable: () => {
      if (calibAvailable) return;
      calibAvailable = true;
      setCalibStatus("Ready");
      openCalibOverlay();
    },
    isInputSuppressed: () => false,
  });

  lanSession = createLanSessionSystem({
    AblyCtor: (win.Ably && win.Ably.Realtime) ? win.Ably.Realtime : null,
    QRCodeLib: (win.QRCode) ? win.QRCode : null,
    workerBase,
    ui: {
      lanModal: null,
      lanQr: null,
      startQr,
      lanUrlText: null,
      lanCopyUrl: null,
      lanRoomCode: null,
      lanCode6: null,
      lanConnState: null,
      lanSafeState: null,
    },
    mobilePageBaseUrl: () => stagingMobilePageBaseUrl(rootDocument),
    syncStartQrSizeToTitlePx: () => syncStartQrSize(rootDocument),
    setStatus: statusSet,
    onImpulse: (payload) => {
      if (mobileImpulseSystem) mobileImpulseSystem.ingestImpulse(payload);
    },
    onPhoneStarted: () => {
      hideStartScreen();
      destroyStartScreen();
      if (mobileImpulseSystem) mobileImpulseSystem.markCalibAvailable();
      else {
        calibAvailable = true;
        setCalibStatus("Ready");
      }
      openCalibOverlay();
    },
  });

  const launchLanPairingFlow = async (forceNew = false) => {
    if (!lanSession) return;
    updateBootUi(
      rootDocument,
      bootStatus.pairingBooting,
      forceNew ? "Launching fresh QR pairing room" : "Launching QR pairing room"
    );
    await lanSession.launch(forceNew);
    showStartScreen();
    destroyBootArtifacts();
    updateBootUi(
      rootDocument,
      bootStatus.pairingReady,
      "QR ready. Pair phone to continue.",
      "ready"
    );
  };

  const sendCalibrationTrigger = () => {
    if (lanSession && lanSession.sendControl("calibrate")) return true;
    return false;
  };

  if (calibBtnEl) {
    calibBtnEl.onclick = () => {
      const canCalibrate = mobileImpulseSystem ? mobileImpulseSystem.isCalibAvailable() : calibAvailable;
      if (!canCalibrate) return;
      if (calibInFlight) return;
      const ok = sendCalibrationTrigger();
      if (!ok) return;
      calibInFlight = true;
      calibBtnEl.disabled = true;
      setCalibStatus("Calibrating… (2s)");
    };
  }

  shellContext.runtime.pairing = {
    uiOverlaysSystem,
    mobileImpulseSystem,
    lanSession,
    kwsPanelController: shellKws ? shellKws.kwsPanelController : null,
    launchLanPairingFlow,
    sendCalibrationTrigger,
    hideStartScreen,
    openCalibOverlay,
    closeCalibOverlay,
    setCalibStatus,
  };

  syncStartQrSize(rootDocument);
  await launchLanPairingFlow(false);

  return shellContext.runtime.pairing;
}
