export function createTransmitterPageShell({
  rootDocument = document,
  versionTag = true,
  versionText = "vtag:shield-debug",
} = {}) {
  const rootWindow = rootDocument.defaultView || window;
  const refs = {
    app: rootDocument.getElementById("app") || rootDocument.querySelector(".app"),
    startBtn: rootDocument.getElementById("startBtn"),
    lanConnecting: rootDocument.getElementById("lanConnecting"),
  };
  let startRevealToken = 0;

  function syncViewportUnit() {
    const viewportBoot = rootWindow.__orbisTransmitterViewportBoot || null;
    if (viewportBoot && typeof viewportBoot.applyVhUnit === "function") {
      viewportBoot.applyVhUnit();
      return;
    }
    const vv = rootWindow.visualViewport;
    const height = vv && vv.height ? vv.height : rootWindow.innerHeight;
    rootDocument.documentElement.style.setProperty("--vh", `${height * 0.01}px`);
  }

  function revealStartButtonWhenStable(token) {
    syncViewportUnit();
    rootWindow.requestAnimationFrame(() => {
      syncViewportUnit();
      rootWindow.requestAnimationFrame(() => {
        if (token !== startRevealToken || !refs.startBtn) return;
        syncViewportUnit();
        refs.startBtn.style.visibility = "visible";
      });
    });
  }

  function setButtonLabel(label = "") {
    if (!refs.startBtn) return;
    refs.startBtn.textContent = String(label || "");
  }

  function setStartReady(ready) {
    if (!refs.startBtn) return;
    startRevealToken += 1;
    const token = startRevealToken;
    refs.startBtn.disabled = !ready;
    refs.startBtn.style.visibility = "hidden";
    if (ready) revealStartButtonWhenStable(token);
  }

  function setStartBusy(busy) {
    if (!refs.startBtn) return;
    refs.startBtn.disabled = !!busy;
  }

  function setMode(mode = "idle") {
    const next = String(mode || "").trim().toLowerCase();
    const isRunning = next === "running";
    if (!isRunning) return;
    if (refs.startBtn && refs.startBtn.parentNode) {
      refs.startBtn.parentNode.removeChild(refs.startBtn);
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
