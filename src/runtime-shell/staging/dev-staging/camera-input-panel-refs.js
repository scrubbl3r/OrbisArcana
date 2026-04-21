export function createCameraInputPanelRefs(root) {
  if (!root) return null;
  const $ = (id) => root.querySelector(`#${id}`);
  return {
    cameraInputPopup: $("cameraInputPopup"),
    cameraInputPopupHeader: $("cameraInputPopupHeader"),
    cameraInputPopupClose: $("cameraInputPopupClose"),
    cameraInputStatusReadout: $("cameraInputStatusReadout"),
    cameraInputLifecycleReadout: $("cameraInputLifecycleReadout"),
    cameraInputPermissionReadout: $("cameraInputPermissionReadout"),
    cameraInputTrackingReadout: $("cameraInputTrackingReadout"),
    cameraInputHandReadout: $("cameraInputHandReadout"),
    cameraInputFailureReadout: $("cameraInputFailureReadout"),
    cameraInputSteeringReadout: $("cameraInputSteeringReadout"),
    cameraInputOrbReadout: $("cameraInputOrbReadout"),
    cameraInputSignalTrack: $("cameraInputSignalTrack"),
    cameraInputSignalFill: $("cameraInputSignalFill"),
    cameraInputSignalDot: $("cameraInputSignalDot"),
    cameraInputSignalConfidence: $("cameraInputSignalConfidence"),
    cameraInputRawXReadout: $("cameraInputRawXReadout"),
    cameraInputFilteredXReadout: $("cameraInputFilteredXReadout"),
    cameraInputCenteredXReadout: $("cameraInputCenteredXReadout"),
    cameraInputConfidenceReadout: $("cameraInputConfidenceReadout"),
    cameraInputFpsReadout: $("cameraInputFpsReadout"),
  };
}
