export function createTelemetryDebugSystem({
  debugReadoutEl,
  teleModalEl,
  teleBtnEl,
  teleBackdropEl,
  teleCloseEl,
  teleRecBtnEl,
  teleOutEl,
  pickDirVec,
}) {
  if (typeof pickDirVec !== "function") {
    throw new Error("createTelemetryDebugSystem requires pickDirVec");
  }

  let teleRecording = false;
  let teleT0 = 0;
  let teleLast = 0;
  let teleLines = 0;
  let teleBuf = [];
  let teleBufChars = 0;
  let teleFlushRAF = 0;

  function updateDebugReadout(text = "—") {
    if (!debugReadoutEl) return;
    debugReadoutEl.textContent = String(text);
  }

  function teleFlushNow() {
    teleFlushRAF = 0;
    if (!teleBuf.length || !teleOutEl) return;
    const chunk = teleBuf.join("");
    teleBuf.length = 0;
    teleBufChars = 0;
    teleOutEl.textContent += chunk;
    if (teleLines % 40 === 0) teleOutEl.scrollTop = teleOutEl.scrollHeight;
    if (teleOutEl.textContent.length > 220000) {
      teleOutEl.textContent += "\n(TRUNCATED: output capped)\n";
      stopTeleRecording();
    }
  }

  function teleQueue(line) {
    teleBuf.push(line);
    teleBufChars += line.length;
    if (!teleFlushRAF) teleFlushRAF = requestAnimationFrame(teleFlushNow);
    if (teleBufChars > 8000) teleFlushNow();
  }

  function openTele() {
    if (!teleModalEl) return;
    teleModalEl.classList.add("on");
    teleModalEl.setAttribute("aria-hidden", "false");
  }

  function stopTeleRecording() {
    teleRecording = false;
    if (teleRecBtnEl) {
      teleRecBtnEl.textContent = "Record";
      teleRecBtnEl.classList.remove("recOn");
    }
    if (teleFlushRAF) {
      cancelAnimationFrame(teleFlushRAF);
      teleFlushRAF = 0;
    }
    teleFlushNow();
  }

  function closeTele() {
    stopTeleRecording();
    if (!teleModalEl) return;
    teleModalEl.classList.remove("on");
    teleModalEl.setAttribute("aria-hidden", "true");
  }

  function startTeleRecording() {
    teleRecording = true;
    teleT0 = performance.now();
    teleLast = teleT0;
    teleLines = 0;

    teleBuf.length = 0;
    teleBufChars = 0;
    if (teleFlushRAF) {
      cancelAnimationFrame(teleFlushRAF);
      teleFlushRAF = 0;
    }

    if (teleOutEl) {
      teleOutEl.textContent =
        "ms\tdms\tspeed01\tenergy01\tgroove01\tdynamics01\tsmooth01\tshake01\tlocked\thz\t" +
        "dirX\tdirY\tdirZ\t" +
        "raw_dirX\traw_dirY\traw_dirZ\t" +
        "raw_omegaX\traw_omegaY\traw_omegaZ\t" +
        "has_dir\thas_omega\t" +
        "d_r2\td_r3\td_gate\td_balance\td_couple\n";
    }

    if (teleRecBtnEl) {
      teleRecBtnEl.textContent = "Stop";
      teleRecBtnEl.classList.add("recOn");
    }
  }

  function toggleTeleRecord() {
    if (!teleRecording) startTeleRecording();
    else stopTeleRecording();
  }

  function telePick01(d, newKey, oldKey) {
    if (d[newKey] != null) {
      const n = Number(d[newKey]);
      return isFinite(n) ? n : 0;
    }
    const n = Number(d[oldKey]);
    if (!isFinite(n)) return 0;
    return (n > 1.5) ? (n / 100) : n;
  }

  function telePickNum(d, key) {
    const n = Number(d && d[key]);
    return isFinite(n) ? n : 0;
  }

  function teleHas(d, key) {
    if (!d) return 0;
    if (d[key] != null) return 1;
    if (key === "dir" && d.a != null) return 1;
    if (key === "omega" && d.r != null) return 1;
    return 0;
  }

  function telePickVecRaw(d, prefix) {
    const fallbackKey = (prefix === "dir") ? "a" : (prefix === "omega") ? "r" : null;
    const src = (d && (d[prefix] != null ? d[prefix] : (fallbackKey ? d[fallbackKey] : null)));

    let x = 0;
    let y = 0;
    let z = 0;

    if (Array.isArray(src) && src.length >= 3) {
      x = Number(src[0]); y = Number(src[1]); z = Number(src[2]);
    } else if (src && typeof src === "object") {
      x = Number(src.x); y = Number(src.y); z = Number(src.z);
    } else {
      x = Number(d && d[prefix + "X"]);
      y = Number(d && d[prefix + "Y"]);
      z = Number(d && d[prefix + "Z"]);
    }

    if (!isFinite(x) || !isFinite(y) || !isFinite(z)) return { x: 0, y: 0, z: 0 };
    return { x, y, z };
  }

  function teleMaybeLog(d) {
    if (!teleRecording) return;

    const now = performance.now();
    const ms = Math.max(0, now - teleT0);
    const dms = Math.max(0, now - teleLast);
    teleLast = now;

    const energy = telePick01(d, "energy01", "energy");
    const groove = telePick01(d, "groove01", "groove");
    const dynamics = telePick01(d, "dynamics01", "orbit01");
    const smooth = telePick01(d, "smooth01", "smooth");
    const speed = telePick01(d, "speed01", "speed");
    const shake = telePick01(d, "shake01", "shake");

    const locked = !!d.locked;
    const hz = (d.hz != null && isFinite(Number(d.hz))) ? Number(d.hz) : 0;

    const dirV = pickDirVec(d);
    const dirX = dirV ? dirV.x : 0;
    const dirY = dirV ? dirV.y : 0;
    const dirZ = dirV ? dirV.z : 0;

    const d_r2 = (d.d_r2 != null) ? telePickNum(d, "d_r2") : telePickNum(d, "o_r2");
    const d_r3 = (d.d_r3 != null) ? telePickNum(d, "d_r3") : telePickNum(d, "o_r3");
    const d_gate = (d.d_gate != null) ? telePickNum(d, "d_gate") : telePickNum(d, "o_gate");
    const d_balance = (d.d_balance != null) ? telePickNum(d, "d_balance") : telePickNum(d, "o_balance");
    const d_couple = (d.d_couple != null) ? telePickNum(d, "d_couple") : telePickNum(d, "o_couple");

    const rawDir = telePickVecRaw(d, "dir");
    const rawOmega = telePickVecRaw(d, "omega");
    const hasDir = teleHas(d, "dir");
    const hasOmega = teleHas(d, "omega");

    const line =
      `${ms.toFixed(1)}\t${dms.toFixed(1)}\t` +
      `${speed.toFixed(4)}\t${energy.toFixed(4)}\t${groove.toFixed(4)}\t${dynamics.toFixed(4)}\t${smooth.toFixed(4)}\t${shake.toFixed(4)}\t` +
      `${locked ? 1 : 0}\t${hz.toFixed(3)}\t` +
      `${dirX.toFixed(4)}\t${dirY.toFixed(4)}\t${dirZ.toFixed(4)}\t` +
      `${rawDir.x.toFixed(4)}\t${rawDir.y.toFixed(4)}\t${rawDir.z.toFixed(4)}\t` +
      `${rawOmega.x.toFixed(4)}\t${rawOmega.y.toFixed(4)}\t${rawOmega.z.toFixed(4)}\t` +
      `${hasDir}\t${hasOmega}\t` +
      `${d_r2.toFixed(4)}\t${d_r3.toFixed(4)}\t${d_gate.toFixed(4)}\t${d_balance.toFixed(4)}\t${d_couple.toFixed(4)}\n`;

    teleLines++;
    teleQueue(line);
  }

  function bindUi() {
    if (teleBtnEl) teleBtnEl.addEventListener("click", openTele);
    if (teleBackdropEl) teleBackdropEl.addEventListener("click", closeTele);
    if (teleCloseEl) teleCloseEl.addEventListener("click", closeTele);
    if (teleRecBtnEl) teleRecBtnEl.addEventListener("click", toggleTeleRecord);
  }

  function isTeleOpen() {
    return !!(teleModalEl && teleModalEl.classList.contains("on"));
  }

  return {
    bindUi,
    openTele,
    closeTele,
    isTeleOpen,
    teleMaybeLog,
    updateDebugReadout,
  };
}
