export function createTransmitterLanSession({
  rootWindow = window,
  ablyCtor = null,
  tokenUrl = "",
  stripOrbPrefix = (room) => String(room || ""),
  stunServers = [],
  lanTokenTtlMs = 60 * 1000,
  setJoinStatus = () => {},
  showLanConnecting = () => {},
  hideLanConnecting = () => {},
  onCalibrate = () => {},
  getUiState = () => "idle",
  getClassicFastPathJoinTransport = () => null,
  setImpulseTransport = () => {},
} = {}) {
  const lanParty = {
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
    sigState: "idle",
    helloRetryTO: null,
    offerSeen: false,
    phoneStartedPending: false,
    phoneStartedSent: false,
    phoneStartedAcked: false,
    phoneStartedRetryTO: null,
    phoneStartedDeadlineTO: null,
  };

  function randomHex(n = 16) {
    const arr = new Uint8Array(n);
    rootWindow.crypto.getRandomValues(arr);
    return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
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

  function buildLanSignalMsg(t, extra) {
    return Object.assign({
      t,
      room: lanParty.roomId,
      token: lanParty.token,
      nonce: randomHex(8),
      ts: Date.now(),
    }, extra || {});
  }

  function publishLanSignal(t, extra) {
    if (!lanParty.pairChannel) return;
    lanParty.pairChannel.publish("pair", buildLanSignalMsg(t, extra));
  }

  function lanSignalValid(d) {
    if (!d || typeof d !== "object") return false;
    if (!lanParty.active) return false;
    if (String(d.room || "") !== lanParty.roomId) return false;
    if (String(d.token || "") !== lanParty.token) return false;
    if (Date.now() > lanParty.expiresAt) return false;
    return true;
  }

  async function connectLanSignalChannel(roomId) {
    const pairRoom = lanPairChannelFor(roomId);
    const authUrl = tokenUrl +
      "?room=" + encodeURIComponent(stripOrbPrefix(pairRoom)) +
      "&clientId=" + encodeURIComponent("phone-lan-" + Math.random().toString(16).slice(2, 6));
    lanParty.pairRealtime = new ablyCtor.Realtime({ authUrl, autoConnect: true });
    lanParty.pairChannel = lanParty.pairRealtime.channels.get(pairRoom);
    await new Promise((resolve, reject) => {
      lanParty.pairChannel.attach((err) => err ? reject(err) : resolve());
    });
    lanParty.sigState = "attached";
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
          if (!pair && r.type === "candidate-pair" && (r.selected || r.nominated) && r.state === "succeeded") pair = r;
        });
      }
      if (!pair) return { safe: false, label: "NOT LAN SAFE (blocked)" };
      const local = stats.get(pair.localCandidateId);
      const remote = stats.get(pair.remoteCandidateId);
      const lt = String(local && local.candidateType || "");
      const rt = String(remote && remote.candidateType || "");
      if (lt === "relay" || rt === "relay") return { safe: false, label: "NOT LAN SAFE (blocked)" };
      if (lt === "host" && rt === "host") return { safe: true, label: "LAN SAFE" };
      return { safe: true, label: "LAN OK" };
    } catch (_) {
      return { safe: false, label: "NOT LAN SAFE (blocked)" };
    }
  }

  function useWebRtcTransport(dc) {
    setImpulseTransport({
      sendImpulse(type, payload) {
        if (!lanParty.gameplayEnabled) return false;
        if (!dc || dc.readyState !== "open") return false;
        try {
          dc.send(JSON.stringify({ t: type, payload }));
          return true;
        } catch (_) {
          return false;
        }
      },
      onImpulse() {},
      close() {
        try { dc.close(); } catch (_) {}
      },
    });
  }

  function sendLanControl(name, extra) {
    if (!lanParty.dc || lanParty.dc.readyState !== "open") return false;
    try {
      lanParty.dc.send(JSON.stringify(Object.assign({
        t: "control",
        name,
        ts: Date.now(),
      }, extra || {})));
      return true;
    } catch (_) {
      return false;
    }
  }

  function clearPhoneStartedRetry() {
    if (lanParty.phoneStartedRetryTO) {
      clearTimeout(lanParty.phoneStartedRetryTO);
      lanParty.phoneStartedRetryTO = null;
    }
    if (lanParty.phoneStartedDeadlineTO) {
      clearTimeout(lanParty.phoneStartedDeadlineTO);
      lanParty.phoneStartedDeadlineTO = null;
    }
  }

  function armPhoneStartedHandshake() {
    if (!lanParty.active || getUiState() !== "running") return;
    lanParty.phoneStartedPending = true;
    lanParty.phoneStartedSent = false;
    lanParty.phoneStartedAcked = false;
    clearPhoneStartedRetry();

    const tick = () => {
      if (!lanParty.active || getUiState() !== "running") {
        clearPhoneStartedRetry();
        return;
      }
      if (lanParty.phoneStartedAcked) {
        lanParty.phoneStartedPending = false;
        clearPhoneStartedRetry();
        return;
      }
      if (sendLanControl("phone_started")) {
        lanParty.phoneStartedSent = true;
      }
      lanParty.phoneStartedRetryTO = setTimeout(tick, 250);
    };

    tick();
    lanParty.phoneStartedDeadlineTO = setTimeout(() => {
      lanParty.phoneStartedPending = false;
      clearPhoneStartedRetry();
    }, 8000);
  }

  function disconnect() {
    const classicFastPathJoinTransport = getClassicFastPathJoinTransport();
    if (classicFastPathJoinTransport && typeof classicFastPathJoinTransport.disconnect === "function") {
      classicFastPathJoinTransport.disconnect();
    }
    if (lanParty.active && lanParty.pairChannel) {
      publishLanSignal("abort", { reason: "joiner_closed" });
    }
    if (lanParty.helloRetryTO) {
      clearTimeout(lanParty.helloRetryTO);
      lanParty.helloRetryTO = null;
    }
    clearPhoneStartedRetry();
    try { if (lanParty.pairChannel) lanParty.pairChannel.unsubscribe(); } catch (_) {}
    try { if (lanParty.pairChannel) lanParty.pairChannel.detach(); } catch (_) {}
    try { if (lanParty.pairRealtime) lanParty.pairRealtime.close(); } catch (_) {}
    lanParty.pairChannel = null;
    lanParty.pairRealtime = null;
    try { if (lanParty.dc) lanParty.dc.close(); } catch (_) {}
    try { if (lanParty.pc) lanParty.pc.close(); } catch (_) {}
    lanParty.pc = null;
    lanParty.dc = null;
    lanParty.gameplayEnabled = false;
    lanParty.active = false;
    lanParty.offerSeen = false;
    lanParty.phoneStartedPending = false;
    lanParty.phoneStartedSent = false;
    lanParty.phoneStartedAcked = false;
    hideLanConnecting();
    setImpulseTransport({
      sendImpulse: () => false,
      onImpulse: () => {},
      close: () => {},
    });
  }

  async function join(roomId, token, code6) {
    if (!roomId || !token) {
      setJoinStatus("Need room + token");
      return false;
    }

    disconnect();
    lanParty.active = true;
    lanParty.roomId = String(roomId || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    lanParty.token = String(token || "").trim();
    lanParty.code6 = code6FromTokenHex(lanParty.token);
    lanParty.expiresAt = Date.now() + lanTokenTtlMs;
    lanParty.offerSeen = false;
    lanParty.phoneStartedPending = false;
    lanParty.phoneStartedSent = false;
    lanParty.phoneStartedAcked = false;
    if (code6 && String(code6).trim() && String(code6).trim() !== lanParty.code6) {
      setJoinStatus("Backup code mismatch");
      return false;
    }

    const classicJoin = getClassicFastPathJoinTransport();
    if (classicJoin && typeof classicJoin.connect === "function") {
      const ok = await classicJoin.connect({
        roomId: lanParty.roomId,
        token: lanParty.token,
      });
      if (!ok) {
        hideLanConnecting();
        return false;
      }
      setImpulseTransport({
        sendImpulse(type, payload) {
          if (type !== "impulse") return false;
          return !!classicJoin.sendImpulse(payload);
        },
        onImpulse() {},
        close() {
          if (classicJoin && typeof classicJoin.disconnect === "function") {
            classicJoin.disconnect();
          }
        },
      });
      return true;
    }

    setJoinStatus("Pairing…");
    try {
      await connectLanSignalChannel(lanParty.roomId);
    } catch (e) {
      console.error("LAN signal attach failed:", e);
      setJoinStatus("Signal attach failed");
      hideLanConnecting();
      return false;
    }
    setJoinStatus("Signal ready; waiting for offer… (" + lanParty.roomId + ")");

    const pc = new RTCPeerConnection({ iceServers: stunServers });
    lanParty.pc = pc;

    pc.onicecandidate = (evt) => {
      if (!evt.candidate) return;
      publishLanSignal("ice", {
        candidate: evt.candidate.candidate,
        sdpMid: evt.candidate.sdpMid,
        sdpMLineIndex: evt.candidate.sdpMLineIndex,
      });
    };

    pc.ondatachannel = (evt) => {
      lanParty.dc = evt.channel;
      const dc = lanParty.dc;
      dc.onopen = async () => {
        const lanSafety = await detectLanSafety(pc);
        lanParty.gameplayEnabled = !!lanSafety.safe;
        useWebRtcTransport(dc);
        if (getUiState() === "running" && !lanParty.phoneStartedAcked) {
          armPhoneStartedHandshake();
        }
        setJoinStatus(lanSafety.safe ? ("Connected (" + lanSafety.label + ")") : lanSafety.label);
        hideLanConnecting();
      };
      dc.onclose = () => {
        lanParty.gameplayEnabled = false;
        hideLanConnecting();
        setJoinStatus("Disconnected");
      };
      dc.onmessage = (evtMsg) => {
        let d = null;
        try { d = JSON.parse(String(evtMsg.data || "")); } catch (_) { return; }
        if (!d || d.t !== "control") return;
        if (d.name === "calibrate") {
          onCalibrate();
        } else if (d.name === "phone_started_ack") {
          lanParty.phoneStartedAcked = true;
          lanParty.phoneStartedPending = false;
          clearPhoneStartedRetry();
        }
      };
    };

    lanParty.pairChannel.subscribe("pair", async (msg) => {
      const d = msg && msg.data ? msg.data : {};
      if (!lanSignalValid(d)) return;
      if (d.t === "host_offer" && d.sdp) {
        lanParty.offerSeen = true;
        if (lanParty.helloRetryTO) {
          clearTimeout(lanParty.helloRetryTO);
          lanParty.helloRetryTO = null;
        }
        try {
          setJoinStatus("Offer received; sending answer…");
          await pc.setRemoteDescription({ type: "offer", sdp: d.sdp });
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          publishLanSignal("join_answer", { sdp: answer.sdp });
          setJoinStatus("Answer sent; connecting…");
        } catch (e) {
          console.error("LAN offer/answer failed:", e);
          setJoinStatus("Offer/answer failed");
          hideLanConnecting();
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
        return;
      }
      if (d.t === "abort") {
        lanParty.gameplayEnabled = false;
        hideLanConnecting();
        setJoinStatus("Aborted");
      }
    });

    publishLanSignal("join_hello", { code6: lanParty.code6 });
    setJoinStatus("Join hello sent");
    const retryHello = () => {
      if (!lanParty.active || lanParty.offerSeen || !lanParty.pairChannel) return;
      publishLanSignal("join_hello", { code6: lanParty.code6 });
      setJoinStatus("Join hello sent (retry)");
      lanParty.helloRetryTO = setTimeout(retryHello, 1000);
    };
    lanParty.helloRetryTO = setTimeout(retryHello, 1000);

    return true;
  }

  async function autoJoinFromPayload(payload) {
    if (!payload || !payload.room || !payload.token) return;
    showLanConnecting();
    setJoinStatus("Auto-joining…");
    await join(payload.room, payload.token, "");
  }

  function isActive() {
    return !!lanParty.active;
  }

  return {
    autoJoinFromPayload,
    join,
    disconnect,
    armPhoneStartedHandshake,
    isActive,
    getState: () => lanParty,
  };
}
