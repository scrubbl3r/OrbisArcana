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
  const shellKws = shellContext.runtime && shellContext.runtime.kws ? shellContext.runtime.kws : null;
  const cameraInputRuntime = shellContext.runtime && shellContext.runtime.cameraInput
    ? shellContext.runtime.cameraInput
    : null;

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
  let lastCalibStatus = "";

  updateBootUi(rootDocument, bootStatus.pairingBooting, "Loading pairing systems");

  const { createUiOverlaysSystem } = await import("../../../ui/game/ui-overlays-system.js?v=20260423a");
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

  const openCalibOverlay = () => uiOverlaysSystem.openCalibOverlay(canRunCalibration());
  const closeCalibOverlay = () => uiOverlaysSystem.closeCalibOverlay();
  const setCalibStatus = (msg) => {
    const next = String(msg || "");
    if (next === lastCalibStatus) return;
    lastCalibStatus = next;
    uiOverlaysSystem.setCalibStatus(next);
  };
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
    setStatus: () => {},
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

  const isCameraReady = () => (
    cameraInputRuntime && typeof cameraInputRuntime.isPreloadReady === "function"
      ? cameraInputRuntime.isPreloadReady()
      : false
  );

  const canRunCalibration = () => {
    const phoneReady = mobileImpulseSystem ? mobileImpulseSystem.isCalibAvailable() : calibAvailable;
    return !!phoneReady && isCameraReady();
  };

  const syncCalibAvailability = () => {
    if (calibBtnEl) calibBtnEl.disabled = !canRunCalibration() || calibInFlight;
  };

  const syncCameraReadout = (state = null) => {
    const snapshot = state || (cameraInputRuntime && typeof cameraInputRuntime.getState === "function"
      ? cameraInputRuntime.getState()
      : null);
    const phoneReady = mobileImpulseSystem ? mobileImpulseSystem.isCalibAvailable() : calibAvailable;
    syncCalibAvailability();
    if (!snapshot) return;
    if (calibInFlight && calibStatusEl) {
      const trackingState = String(snapshot.tracking && snapshot.tracking.state || "");
      if (trackingState === "tracking") {
        setCalibStatus("Calibrating… phone live, camera hand tracked");
      } else if (trackingState === "wrong_hand") {
        setCalibStatus("Calibrating… show your left hand");
      }
    } else if (calibStatusEl && phoneReady) {
      setCalibStatus(isCameraReady() ? "Ready" : "Loading camera input…");
    }
  };

  if (cameraInputRuntime && typeof cameraInputRuntime.subscribe === "function") {
    cameraInputRuntime.subscribe((state) => {
      syncCameraReadout(state);
    });
  }

  if (calibBtnEl) {
    calibBtnEl.onclick = async () => {
      if (!canRunCalibration()) return;
      if (calibInFlight) return;
      calibInFlight = true;
      syncCalibAvailability();
      try {
        if (cameraInputRuntime && typeof cameraInputRuntime.startCalibrationCapture === "function") {
          setCalibStatus("Starting camera + phone calibration…");
          await cameraInputRuntime.startCalibrationCapture();
        }
      } catch (error) {
        calibInFlight = false;
        syncCalibAvailability();
        setCalibStatus("Camera access required");
        return;
      }
      const ok = sendCalibrationTrigger();
      if (!ok) {
        calibInFlight = false;
        setCalibStatus("Phone calibration unavailable");
        syncCalibAvailability();
        return;
      }
      syncCalibAvailability();
      setCalibStatus("Calibrating… (2s) + camera live");
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
    syncCalibAvailability,
  };

  syncStartQrSize(rootDocument);
  await launchLanPairingFlow(false);

  return shellContext.runtime.pairing;
}
