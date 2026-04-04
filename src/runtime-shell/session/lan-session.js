export function createLanSessionSystem({
  AblyCtor,
  QRCodeLib,
  pairingServiceFactory,
  fastPathHostTransportFactory,
  workerBase,
  ui,
  mobilePageBaseUrl,
  syncStartQrSizeToTitlePx,
  setStatus,
  onImpulse,
  onPhoneStarted,
  tokenTtlMs = 3 * 60 * 1000,
  stunServers = [{ urls: "stun:stun.l.google.com:19302" }],
}) {
  if (!AblyCtor) throw new Error("createLanSessionSystem requires AblyCtor");
  if (!workerBase) throw new Error("createLanSessionSystem requires workerBase");
  if (!ui) throw new Error("createLanSessionSystem requires ui");
  if (typeof mobilePageBaseUrl !== "function") throw new Error("createLanSessionSystem requires mobilePageBaseUrl");
  if (typeof syncStartQrSizeToTitlePx !== "function") throw new Error("createLanSessionSystem requires syncStartQrSizeToTitlePx");
  if (typeof setStatus !== "function") throw new Error("createLanSessionSystem requires setStatus");

  const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  const state = {
    active: false,
    roomId: "",
    token: "",
    code6: "",
    expiresAt: 0,
    pairRealtime: null,
    pairChannel: null,
    pc: null,
    dc: null,
    gameplayEnabled: false,
    offerSdp: "",
    offerRetryTO: null,
    expiryTO: null,
    helloSeen: false,
  };
  let classicPairingService = null;
  let classicFastPathHost = null;

  function nowTs() {
    return Date.now();
  }

  function randomTokenBytes(n = 16) {
    const arr = new Uint8Array(n);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(arr);
      return arr;
    }
    for (let i = 0; i < n; i++) arr[i] = Math.floor(Math.random() * 256);
    return arr;
  }

  function toHex(bytes) {
    return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function nonce8() {
    return toHex(randomTokenBytes(8));
  }

  function randCode(n = 8) {
    let s = "";
    for (let i = 0; i < n; i++) {
      s += ROOM_ALPHABET[(Math.random() * ROOM_ALPHABET.length) | 0];
    }
    return s;
  }

  function code6FromTokenHex(tokenHex) {
    const tail = String(tokenHex || "").slice(-10);
    const n = parseInt(tail || "0", 16) % 1000000;
    return String(n).padStart(6, "0");
  }

  function lanPairChannelFor(roomId) {
    const code = String(roomId || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "") || "TEST";
    return "orb:" + code;
  }

  function stripOrbPrefix(room) {
    return String(room || "").startsWith("orb:") ? String(room).slice(4) : String(room || "");
  }

  function lanJoinUrl(roomId, token) {
    const base = mobilePageBaseUrl();
    return base + "?join=1&room=" + encodeURIComponent(roomId) + "&token=" + encodeURIComponent(token);
  }

  function setLanConnState(msg) {
    if (ui.lanConnState) ui.lanConnState.textContent = "Status: " + msg;
  }

  function setLanSafeState(msg) {
    if (ui.lanSafeState) ui.lanSafeState.textContent = "LAN SAFE: " + msg;
  }

  function openModal() {
    if (!ui.lanModal) return;
    ui.lanModal.classList.add("on");
    ui.lanModal.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    if (!ui.lanModal) return;
    ui.lanModal.classList.remove("on");
    ui.lanModal.setAttribute("aria-hidden", "true");
  }

  function cleanupSignaling() {
    try { if (state.pairChannel) state.pairChannel.unsubscribe(); } catch (_) {}
    try { if (state.pairChannel) state.pairChannel.detach(); } catch (_) {}
    try { if (state.pairRealtime) state.pairRealtime.close(); } catch (_) {}
    state.pairChannel = null;
    state.pairRealtime = null;
  }

  function cleanupPeer() {
    if (state.offerRetryTO) {
      clearTimeout(state.offerRetryTO);
      state.offerRetryTO = null;
    }
    if (state.expiryTO) {
      clearTimeout(state.expiryTO);
      state.expiryTO = null;
    }
    try { if (state.dc) state.dc.close(); } catch (_) {}
    try { if (state.pc) state.pc.close(); } catch (_) {}
    state.dc = null;
    state.pc = null;
    state.offerSdp = "";
    state.helloSeen = false;
    try { if (classicFastPathHost) classicFastPathHost.reset(); } catch (_) {}
  }

  function publishSignal(t, extra) {
    if (!state.pairChannel) return;
    const msg = Object.assign({
      t,
      room: state.roomId,
      token: state.token,
      nonce: nonce8(),
      ts: nowTs(),
    }, extra || {});
    state.pairChannel.publish("pair", msg);
  }

  function reset() {
    if (classicPairingService && state.active) {
      classicPairingService.reset({ reason: "host_closed" });
      classicPairingService = null;
    } else if (state.active && state.pairChannel) {
      publishSignal("abort", { reason: "host_closed" });
    }
    state.active = false;
    state.gameplayEnabled = false;
    cleanupPeer();
    cleanupSignaling();
    classicFastPathHost = null;
    setLanConnState("Closed");
    setLanSafeState("Pending…");
  }

  async function renderQrInto(el, url, size) {
    if (!el) return;
    el.innerHTML = "";
    if (!QRCodeLib || !QRCodeLib.toCanvas) {
      el.textContent = "QR unavailable";
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    el.appendChild(canvas);
    try {
      await QRCodeLib.toCanvas(canvas, url, {
        width: Math.max(120, size - 20),
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      });
    } catch (_) {
      el.textContent = "QR render error";
    }
  }

  async function renderLanQr(url) {
    const startSize = syncStartQrSizeToTitlePx() || 280;
    await Promise.all([
      renderQrInto(ui.lanQr, url, 280),
      renderQrInto(ui.startQr, url, startSize),
    ]);
  }

  async function connectSignalChannel(roomId) {
    const pairRoom = lanPairChannelFor(roomId);
    const authUrl = workerBase + "/token?room=" + encodeURIComponent(stripOrbPrefix(pairRoom)) + "&v=" + Date.now();
    const rt = new AblyCtor({ authUrl, echoMessages: false });
    const ch = rt.channels.get(pairRoom);
    await new Promise((resolve, reject) => {
      ch.attach((err) => err ? reject(err) : resolve());
    });
    state.pairRealtime = rt;
    state.pairChannel = ch;
  }

  function msgValid(d) {
    if (!d || typeof d !== "object") return false;
    if (!state.active) return false;
    if (String(d.room || "") !== state.roomId) return false;
    if (String(d.token || "") !== state.token) return false;
    if (nowTs() > state.expiresAt) {
      setLanConnState("Pair token expired");
      return false;
    }
    return true;
  }

  async function detectLanSafety(pc) {
    try {
      const stats = await pc.getStats();
      let pair = null;
      stats.forEach((r) => {
        if (r.type === "transport" && r.selectedCandidatePairId && stats.get(r.selectedCandidatePairId)) {
          pair = stats.get(r.selectedCandidatePairId);
        }
      });
      if (!pair) {
        stats.forEach((r) => {
          if (!pair && r.type === "candidate-pair" && (r.selected || r.nominated) && r.state === "succeeded") {
            pair = r;
          }
        });
      }
      if (!pair) return { safe: false, label: "NOT LAN SAFE ⚠️ (blocked)" };

      const local = stats.get(pair.localCandidateId);
      const remote = stats.get(pair.remoteCandidateId);
      const localType = String(local && local.candidateType || "");
      const remoteType = String(remote && remote.candidateType || "");
      if (localType === "relay" || remoteType === "relay") {
        return { safe: false, label: "NOT LAN SAFE ⚠️ (blocked)" };
      }
      if (localType === "host" && remoteType === "host") {
        return { safe: true, label: "LAN SAFE ✅" };
      }
      return { safe: true, label: "LAN OK ✅" };
    } catch (_) {
      return { safe: false, label: "NOT LAN SAFE ⚠️ (blocked)" };
    }
  }

  function onDcMessage(evt) {
    let d = null;
    try { d = JSON.parse(String(evt.data || "")); } catch (_) { return; }
    if (d && d.t === "control" && d.name === "phone_started") {
      sendControl("phone_started_ack");
      closeModal();
      if (typeof onPhoneStarted === "function") onPhoneStarted(d);
      return;
    }
    if (!state.gameplayEnabled) return;
    if (!d || d.t !== "impulse" || !d.payload) return;
    if (typeof onImpulse === "function") onImpulse(d.payload);
  }

  async function buildAndPublishOffer(pc) {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    state.offerSdp = offer.sdp;
    publishSignal("host_offer", { sdp: state.offerSdp });
    setLanConnState("Offer sent");
  }

  async function startHostFlow() {
    if (typeof pairingServiceFactory === "function" && typeof fastPathHostTransportFactory === "function") {
      reset();

      classicPairingService = pairingServiceFactory({
        ablyCtor: AblyCtor,
        qrCodeLib: QRCodeLib,
        workerBase,
        mobileJoinUrl: (roomId, token) => lanJoinUrl(roomId, token),
        tokenTtlMs,
      });

      classicFastPathHost = fastPathHostTransportFactory({
        stunServers,
        onImpulse,
        onPhoneStarted: (d) => {
          closeModal();
          if (typeof onPhoneStarted === "function") onPhoneStarted(d);
        },
        onConnectionState: (msg) => setLanConnState(msg),
        onSafetyState: (lanSafety) => {
          setLanSafeState(lanSafety && lanSafety.label ? lanSafety.label : "Pending…");
          state.gameplayEnabled = !!(lanSafety && lanSafety.safe);
        },
      });

      setLanConnState("Waiting for phone…");
      setLanSafeState("Pending…");

      await classicPairingService.launch({
        qrEl: ui.lanQr,
        urlTextEl: ui.lanUrlText,
        copyBtn: ui.lanCopyUrl,
        onSignal: async (d) => {
          if (classicFastPathHost && typeof classicFastPathHost.handleSignal === "function") {
            await classicFastPathHost.handleSignal(d);
          }
        },
      });

      const classicState = classicPairingService.getState();
      state.active = true;
      state.roomId = classicState.roomId;
      state.token = classicState.token;
      state.code6 = classicState.code6;
      state.expiresAt = classicState.expiresAt;

      if (ui.lanRoomCode) ui.lanRoomCode.textContent = state.roomId;
      if (ui.lanCode6) ui.lanCode6.textContent = state.code6;
      if (ui.lanUrlText) ui.lanUrlText.textContent = classicState.joinUrl;

      await renderLanQr(classicState.joinUrl);

      if (classicFastPathHost && typeof classicFastPathHost.start === "function") {
        await classicFastPathHost.start({
          publishSignal: (t, extra) => classicPairingService.publishSignal(t, extra),
        });
      }

      setLanConnState("Pairing…");
      setStatus(`LAN host ready <span class="dim">(orb:${state.roomId})</span>`, "ok");
      return;
    }

    reset();
    state.active = true;
    state.roomId = randCode(8);
    state.token = toHex(randomTokenBytes(16));
    state.code6 = code6FromTokenHex(state.token);
    state.expiresAt = nowTs() + tokenTtlMs;
    state.gameplayEnabled = false;

    setLanConnState("Waiting for phone…");
    setLanSafeState("Pending…");
    if (ui.lanRoomCode) ui.lanRoomCode.textContent = state.roomId;
    if (ui.lanCode6) ui.lanCode6.textContent = state.code6;

    const joinUrl = lanJoinUrl(state.roomId, state.token);
    if (ui.lanUrlText) ui.lanUrlText.textContent = joinUrl;
    if (ui.lanCopyUrl) {
      ui.lanCopyUrl.onclick = async () => {
        try {
          await navigator.clipboard.writeText(joinUrl);
          ui.lanCopyUrl.textContent = "Copied";
        } catch (_) {
          ui.lanCopyUrl.textContent = "Nope";
        }
        setTimeout(() => { if (ui.lanCopyUrl) ui.lanCopyUrl.textContent = "Copy"; }, 800);
      };
    }
    await renderLanQr(joinUrl);

    await connectSignalChannel(state.roomId);
    setLanConnState("Signal ready");

    const pc = new RTCPeerConnection({ iceServers: stunServers });
    const dc = pc.createDataChannel("orb-control", { ordered: false, maxRetransmits: 0 });
    state.pc = pc;
    state.dc = dc;

    dc.onopen = async () => {
      setLanConnState("Connected");
      const lanSafety = await detectLanSafety(pc);
      setLanSafeState(lanSafety.label);
      state.gameplayEnabled = !!lanSafety.safe;
      if (state.offerRetryTO) {
        clearTimeout(state.offerRetryTO);
        state.offerRetryTO = null;
      }
    };
    dc.onclose = () => {
      state.gameplayEnabled = false;
      setLanConnState("Disconnected");
    };
    dc.onmessage = onDcMessage;

    pc.onicecandidate = (evt) => {
      if (!evt.candidate) return;
      publishSignal("ice", {
        candidate: evt.candidate.candidate,
        sdpMid: evt.candidate.sdpMid,
        sdpMLineIndex: evt.candidate.sdpMLineIndex,
      });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        state.gameplayEnabled = false;
        setLanConnState("Connection failed");
      }
    };

    state.pairChannel.subscribe("pair", async (msg) => {
      const d = msg && msg.data ? msg.data : {};
      if (!msgValid(d)) return;
      if (d.t === "join_hello") {
        state.helloSeen = true;
        setLanConnState("Join hello received");
        try {
          if (!state.offerSdp) {
            await buildAndPublishOffer(pc);
          } else {
            publishSignal("host_offer", { sdp: state.offerSdp });
            setLanConnState("Offer re-sent");
          }
        } catch (e) {
          console.error("LAN offer build failed:", e);
          setLanConnState("Offer failed");
        }
        return;
      }
      if (d.t === "join_answer" && d.sdp && !pc.currentRemoteDescription) {
        try {
          await pc.setRemoteDescription({ type: "answer", sdp: d.sdp });
          setLanConnState("Connecting…");
        } catch (e) {
          console.error("LAN setRemote(answer) failed:", e);
          setLanConnState("Answer rejected");
        }
        return;
      }
      if (d.t === "ice" && d.candidate) {
        try {
          await pc.addIceCandidate({
            candidate: d.candidate,
            sdpMid: d.sdpMid,
            sdpMLineIndex: d.sdpMLineIndex,
          });
        } catch (_) {}
      }
      if (d.t === "abort") {
        state.gameplayEnabled = false;
        setLanConnState("Aborted");
      }
    });

    await buildAndPublishOffer(pc);
    const retryOffer = () => {
      if (!state.active || !state.pc || state.pc.currentRemoteDescription) return;
      if (!state.helloSeen) setLanConnState("Waiting for join hello…");
      publishSignal("host_offer", { sdp: state.offerSdp });
      state.offerRetryTO = setTimeout(retryOffer, 1000);
    };
    state.offerRetryTO = setTimeout(retryOffer, 1000);
    setLanConnState("Pairing…");
    state.expiryTO = setTimeout(() => {
      if (!state.active || state.gameplayEnabled) return;
      setLanConnState("Pair token expired");
    }, tokenTtlMs + 50);
    setStatus(`LAN host ready <span class="dim">(orb:${state.roomId})</span>`, "ok");
  }

  async function launch(forceNew = false) {
    if (state.active && !forceNew) return;
    await startHostFlow();
  }

  function end() {
    reset();
    closeModal();
  }

  function shouldIgnoreAblyImpulses() {
    if (classicFastPathHost && typeof classicFastPathHost.shouldIgnoreRelayImpulses === "function") {
      return !!classicFastPathHost.shouldIgnoreRelayImpulses();
    }
    return !!(state.active && state.gameplayEnabled);
  }

  function sendControl(name, extra = {}) {
    if (classicFastPathHost && typeof classicFastPathHost.sendControl === "function") {
      return !!classicFastPathHost.sendControl(name, extra);
    }
    if (!state.active || !state.dc || state.dc.readyState !== "open") return false;
    const msg = Object.assign({ t: "control", name, ts: Date.now() }, extra || {});
    try {
      state.dc.send(JSON.stringify(msg));
      return true;
    } catch (_) {
      return false;
    }
  }

  function getState() {
    return {
      active: state.active,
      gameplayEnabled: state.gameplayEnabled,
      roomId: state.roomId,
      code6: state.code6,
    };
  }

  return {
    launch,
    end,
    reset,
    openModal,
    closeModal,
    shouldIgnoreAblyImpulses,
    sendControl,
    getState,
  };
}
