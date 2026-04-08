export function createTransmitterPageShell({
  rootDocument = document,
  versionTag = true,
  versionText = "vtag:shield-debug",
} = {}) {
  const refs = {
    app: rootDocument.getElementById("app") || rootDocument.querySelector(".app"),
    startCard: rootDocument.getElementById("startCard"),
    startBtn: rootDocument.getElementById("startBtn"),
    lanConnecting: rootDocument.getElementById("lanConnecting"),
  };

  function setButtonLabel(label = "") {
    if (!refs.startBtn) return;
    refs.startBtn.textContent = String(label || "");
  }

  function setStartReady(ready) {
    if (!refs.startBtn) return;
    refs.startBtn.style.visibility = ready ? "visible" : "hidden";
    refs.startBtn.disabled = !ready;
  }

  function setStartBusy(busy) {
    if (!refs.startBtn) return;
    refs.startBtn.disabled = !!busy;
  }

  function setMode(mode = "idle") {
    const next = String(mode || "").trim().toLowerCase();
    const isRunning = next === "running";
    if (rootDocument && rootDocument.body) {
      rootDocument.body.classList.toggle("transmitterRunning", isRunning);
    }
    if (!isRunning) return;
    if (refs.startCard && refs.startCard.parentNode) {
      refs.startCard.parentNode.removeChild(refs.startCard);
      refs.startCard = null;
      refs.startBtn = null;
    }
  }

  function showLanConnecting() {
    if (!refs.lanConnecting) return;
    refs.lanConnecting.classList.add("on");
    refs.lanConnecting.setAttribute("aria-hidden", "false");
  }

  function hideLanConnecting() {
    if (!refs.lanConnecting) return;
    refs.lanConnecting.classList.remove("on");
    refs.lanConnecting.setAttribute("aria-hidden", "true");
  }

  function setJoinStatus(_msg) {
    // Intentionally silent in production mobile UI.
  }

  if (versionTag) {
    const tag = rootDocument.createElement("div");
    tag.textContent = versionText;
    tag.style.position = "fixed";
    tag.style.left = "50%";
    tag.style.bottom = "8px";
    tag.style.transform = "translateX(-50%)";
    tag.style.fontSize = "11px";
    tag.style.opacity = "0.65";
    tag.style.letterSpacing = "0.04em";
    tag.style.pointerEvents = "none";
    tag.style.color = "rgba(var(--accent-rgb), 0.9)";
    rootDocument.body.appendChild(tag);
  }

  setStartReady(false);

  return {
    refs,
    setButtonLabel,
    setStartReady,
    setStartBusy,
    setMode,
    setJoinStatus,
    showLanConnecting,
    hideLanConnecting,
  };
}
