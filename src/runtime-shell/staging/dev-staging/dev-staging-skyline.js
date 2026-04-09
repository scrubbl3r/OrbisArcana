function clamp01(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function setText(el, value) {
  if (!el) return;
  el.textContent = String(value == null ? "" : value);
}

function setMarker(el, ratio, label) {
  if (!el) return;
  el.style.top = `${(clamp01(ratio) * 100).toFixed(2)}%`;
  if (label != null) el.textContent = String(label);
}

export function resetDevStagingSkyline(refs) {
  if (!refs) return;
  setText(refs.skylineWorldHeight, "0");
  setText(refs.skylineViewportHeight, "0");
  setText(refs.skylineOrbY, "0");
  setText(refs.skylineCameraY, "0");
  setMarker(refs.skylineMarkerTop, 0, "TOP");
  setMarker(refs.skylineMarkerViewportTop, 0, "CAM");
  setMarker(refs.skylineMarkerOrb, 1, "ORB");
  setMarker(refs.skylineMarkerGround, 1, "GND");
  if (refs.skylineViewportWindow) {
    refs.skylineViewportWindow.style.top = "0%";
    refs.skylineViewportWindow.style.height = "0%";
  }
}

export function renderDevStagingSkyline(refs, vm) {
  if (!refs || !vm) return;
  const worldHeight = Math.max(1, Number(vm.worldHeightPx) || 1);
  const viewportHeight = Math.max(0, Number(vm.viewportHeightPx) || 0);
  const orbY = Math.max(0, Math.min(worldHeight, Number(vm.orbYWorld) || 0));
  const cameraTop = Math.max(0, Math.min(worldHeight, Number(vm.cameraTopWorld) || 0));
  const groundY = Math.max(0, Math.min(worldHeight, Number(vm.groundYWorld) || 0));
  const cameraBottom = Math.max(cameraTop, Math.min(worldHeight, cameraTop + viewportHeight));
  const cameraHeightRatio = clamp01((cameraBottom - cameraTop) / worldHeight);
  const cameraTopRatio = clamp01(cameraTop / worldHeight);

  setText(refs.skylineWorldHeight, Math.round(worldHeight));
  setText(refs.skylineViewportHeight, Math.round(viewportHeight));
  setText(refs.skylineOrbY, Math.round(orbY));
  setText(refs.skylineCameraY, Math.round(cameraTop));

  setMarker(refs.skylineMarkerTop, 0, "TOP");
  setMarker(refs.skylineMarkerViewportTop, cameraTopRatio, "CAM");
  setMarker(refs.skylineMarkerOrb, clamp01(orbY / worldHeight), "ORB");
  setMarker(refs.skylineMarkerGround, clamp01(groundY / worldHeight), "GND");

  if (refs.skylineViewportWindow) {
    refs.skylineViewportWindow.style.top = `${(cameraTopRatio * 100).toFixed(2)}%`;
    refs.skylineViewportWindow.style.height = `${Math.max(cameraHeightRatio * 100, 1).toFixed(2)}%`;
  }
}
