function clamp01(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n <= 0) return 0;
  if (n >= 1) return 1;
  return n;
}

function formatFixed(value, digits = 3, fallback = "-") {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(digits) : String(fallback);
}

export function createCameraInputPopup({
  els = {},
} = {}) {
  let bound = false;
  let open = false;
  let drag = null;

  function renderTrack(state = null) {
    const tracking = state && state.tracking ? state.tracking : {};
    const filteredX01 = clamp01(tracking.filteredX01 == null ? 0.5 : tracking.filteredX01);
    const centeredX01 = Number.isFinite(Number(tracking.centeredX01)) ? Number(tracking.centeredX01) : 0;
    const confidence = clamp01(tracking.confidence);
    const positionPct = filteredX01 * 100;
    const magnitudePct = Math.abs(centeredX01) * 50;

    if (els.cameraInputSignalDot) {
      els.cameraInputSignalDot.style.left = `${positionPct.toFixed(2)}%`;
    }
    if (els.cameraInputSignalFill) {
      els.cameraInputSignalFill.style.width = `${magnitudePct.toFixed(2)}%`;
      els.cameraInputSignalFill.dataset.side = centeredX01 >= 0 ? "right" : "left";
      els.cameraInputSignalFill.style.left = centeredX01 >= 0 ? "50%" : `${(50 - magnitudePct).toFixed(2)}%`;
    }
    if (els.cameraInputSignalTrack) {
      els.cameraInputSignalTrack.dataset.trackingState = String(tracking.state || "idle");
    }
    if (els.cameraInputSignalConfidence) {
      els.cameraInputSignalConfidence.textContent = `${Math.round(confidence * 100)}%`;
    }
  }

  function renderState(state = null) {
    const lifecycle = state && state.lifecycle ? state.lifecycle : {};
    const tracking = state && state.tracking ? state.tracking : {};
    const failures = state && state.failures ? state.failures : {};
    const debug = state && state.debug ? state.debug : {};

    if (els.cameraInputLifecycleReadout) {
      els.cameraInputLifecycleReadout.textContent =
        `${String(lifecycle.preloadState || "idle")} / ${String(lifecycle.runtimeState || "idle")}`;
    }
    if (els.cameraInputPermissionReadout) {
      els.cameraInputPermissionReadout.textContent = String(lifecycle.permissionState || "unknown");
    }
    if (els.cameraInputTrackingReadout) {
      els.cameraInputTrackingReadout.textContent = String(tracking.state || "idle");
    }
    if (els.cameraInputHandReadout) {
      const handedness = String(tracking.handedness || "-");
      const score = formatFixed(tracking.handednessScore, 3, "0.000");
      els.cameraInputHandReadout.textContent = `${handedness} (${score})`;
    }
    if (els.cameraInputConfidenceReadout) {
      els.cameraInputConfidenceReadout.textContent = formatFixed(tracking.confidence, 3, "0.000");
    }
    if (els.cameraInputRawXReadout) {
      els.cameraInputRawXReadout.textContent = formatFixed(tracking.rawX01, 3, "0.500");
    }
    if (els.cameraInputFilteredXReadout) {
      els.cameraInputFilteredXReadout.textContent = formatFixed(tracking.filteredX01, 3, "0.500");
    }
    if (els.cameraInputCenteredXReadout) {
      els.cameraInputCenteredXReadout.textContent = formatFixed(tracking.centeredX01, 3, "0.000");
    }
    if (els.cameraInputFpsReadout) {
      els.cameraInputFpsReadout.textContent = formatFixed(debug.fps, 1, "0.0");
    }
    if (els.cameraInputFailureReadout) {
      const code = String(failures.code || "").trim();
      els.cameraInputFailureReadout.textContent = code || "none";
      els.cameraInputFailureReadout.dataset.state = code ? "bad" : "ok";
    }
    if (els.cameraInputStatusReadout) {
      els.cameraInputStatusReadout.textContent = String(debug.statusLine || "cam:idle");
    }

    renderTrack(state);
  }

  function setOpen(nextOpen) {
    open = !!nextOpen;
    if (els.cameraInputPopup) {
      els.cameraInputPopup.classList.toggle("on", open);
      els.cameraInputPopup.setAttribute("aria-hidden", open ? "false" : "true");
    }
  }

  function beginDrag(ev) {
    if (!els.cameraInputPopup || !els.cameraInputPopupHeader) return;
    if (ev.target && typeof ev.target.closest === "function" && ev.target.closest("button")) return;
    const rect = els.cameraInputPopup.getBoundingClientRect();
    drag = {
      pointerId: ev.pointerId,
      offsetX: ev.clientX - rect.left,
      offsetY: ev.clientY - rect.top,
    };
    try { els.cameraInputPopupHeader.setPointerCapture(ev.pointerId); } catch (_) {}
    ev.preventDefault();
  }

  function moveDrag(ev) {
    if (!drag || !els.cameraInputPopup) return;
    const maxLeft = Math.max(0, window.innerWidth - els.cameraInputPopup.offsetWidth);
    const maxTop = Math.max(0, window.innerHeight - els.cameraInputPopup.offsetHeight);
    const left = Math.max(0, Math.min(maxLeft, ev.clientX - drag.offsetX));
    const top = Math.max(0, Math.min(maxTop, ev.clientY - drag.offsetY));
    els.cameraInputPopup.style.left = `${left}px`;
    els.cameraInputPopup.style.top = `${top}px`;
  }

  function endDrag() {
    if (!drag || !els.cameraInputPopupHeader) return;
    try { els.cameraInputPopupHeader.releasePointerCapture(drag.pointerId); } catch (_) {}
    drag = null;
  }

  function bind() {
    if (bound) return;
    bound = true;
    if (els.cameraInputBtn) {
      els.cameraInputBtn.addEventListener("click", () => {
        setOpen(!open);
      });
    }
    if (els.cameraInputPopupClose) {
      els.cameraInputPopupClose.addEventListener("click", () => setOpen(false));
    }
    if (els.cameraInputPopupHeader) {
      els.cameraInputPopupHeader.addEventListener("pointerdown", beginDrag);
      els.cameraInputPopupHeader.addEventListener("pointermove", moveDrag);
      els.cameraInputPopupHeader.addEventListener("pointerup", endDrag);
      els.cameraInputPopupHeader.addEventListener("pointercancel", endDrag);
    }
  }

  return {
    bind,
    renderState,
    isOpen: () => open,
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle: () => setOpen(!open),
  };
}
