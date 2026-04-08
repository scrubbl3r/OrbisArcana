export function createTransmitterMotionInput({ rootWindow = window } = {}) {
  function addListeners({ onMotion, onOrient }) {
    if (typeof onMotion === "function") {
      rootWindow.addEventListener("devicemotion", onMotion, { passive: true });
    }
    if (typeof onOrient === "function") {
      rootWindow.addEventListener("deviceorientation", onOrient, { passive: true });
    }
  }

  function removeListeners({ onMotion, onOrient }) {
    if (typeof onMotion === "function") {
      rootWindow.removeEventListener("devicemotion", onMotion);
    }
    if (typeof onOrient === "function") {
      rootWindow.removeEventListener("deviceorientation", onOrient);
    }
  }

  async function requestPermissionIfNeeded() {
    const needs =
      (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function")
      || (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function");

    if (!needs) return true;

    const requests = [];

    if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
      requests.push(DeviceMotionEvent.requestPermission().then((s) => s === "granted").catch(() => false));
    }

    if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
      requests.push(DeviceOrientationEvent.requestPermission().then((s) => s === "granted").catch(() => false));
    }

    const results = await Promise.all(requests);
    return results.every(Boolean);
  }

  return {
    addListeners,
    removeListeners,
    requestPermissionIfNeeded,
  };
}
