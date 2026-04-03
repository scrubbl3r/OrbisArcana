(function(global){
  function detectLanSafety(pc){
    return pc.getStats().then((stats) => {
      let pair = null;
      stats.forEach((report) => {
        if (report.type === "transport" && report.selectedCandidatePairId && stats.get(report.selectedCandidatePairId)) {
          pair = stats.get(report.selectedCandidatePairId);
        }
      });
      if (!pair) {
        stats.forEach((report) => {
          if (!pair && report.type === "candidate-pair" && (report.selected || report.nominated) && report.state === "succeeded") {
            pair = report;
          }
        });
      }
      if (!pair) return { safe: false, label: "NOT LAN SAFE (blocked)" };
      const local = stats.get(pair.localCandidateId);
      const remote = stats.get(pair.remoteCandidateId);
      const localType = String(local && local.candidateType || "");
      const remoteType = String(remote && remote.candidateType || "");
      if (localType === "relay" || remoteType === "relay") {
        return { safe: false, label: "NOT LAN SAFE (blocked)" };
      }
      if (localType === "host" && remoteType === "host") {
        return { safe: true, label: "LAN SAFE" };
      }
      return { safe: true, label: "LAN OK" };
    }).catch(() => ({ safe: false, label: "NOT LAN SAFE (blocked)" }));
  }

  function createFastPathHostTransport(options){
    const stunServers = options && options.stunServers || [{ urls: "stun:stun.l.google.com:19302" }];
    const onImpulse = options && options.onImpulse;
    const onPhoneStarted = options && options.onPhoneStarted;
    const onConnectionState = options && options.onConnectionState;
    const onSafetyState = options && options.onSafetyState;

    const state = {
      active: false,
      pc: null,
      dc: null,
      gameplayEnabled: false,
      offerSdp: "",
      offerRetryTO: null,
      helloSeen: false,
      publishSignal: null,
    };

    function clearRetry(){
      if (state.offerRetryTO) {
        clearTimeout(state.offerRetryTO);
        state.offerRetryTO = null;
      }
    }

    function cleanupPeer(){
      clearRetry();
      try { if (state.dc) state.dc.close(); } catch (_) {}
      try { if (state.pc) state.pc.close(); } catch (_) {}
      state.dc = null;
      state.pc = null;
      state.offerSdp = "";
      state.helloSeen = false;
      state.gameplayEnabled = false;
    }

    async function buildAndPublishOffer(pc){
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      state.offerSdp = offer.sdp;
      if (state.publishSignal) state.publishSignal("host_offer", { sdp: state.offerSdp });
      if (typeof onConnectionState === "function") onConnectionState("Offer sent");
    }

    function onDcMessage(evt){
      let d = null;
      try { d = JSON.parse(String(evt.data || "")); } catch (_) { return; }
      if (d && d.t === "control" && d.name === "phone_started") {
        sendControl("phone_started_ack");
        if (typeof onPhoneStarted === "function") onPhoneStarted(d);
        return;
      }
      if (!state.gameplayEnabled) return;
      if (!d || d.t !== "impulse" || !d.payload) return;
      if (typeof onImpulse === "function") onImpulse(d.payload);
    }

    async function start(config){
      cleanupPeer();
      state.active = true;
      state.publishSignal = config && config.publishSignal;

      const pc = new RTCPeerConnection({ iceServers: stunServers });
      const dc = pc.createDataChannel("orb-control", { ordered: false, maxRetransmits: 0 });
      state.pc = pc;
      state.dc = dc;

      dc.onopen = async () => {
        if (typeof onConnectionState === "function") onConnectionState("Connected");
        const lanSafety = await detectLanSafety(pc);
        state.gameplayEnabled = !!lanSafety.safe;
        if (typeof onSafetyState === "function") onSafetyState(lanSafety);
        clearRetry();
      };
      dc.onclose = () => {
        state.gameplayEnabled = false;
        if (typeof onConnectionState === "function") onConnectionState("Disconnected");
      };
      dc.onmessage = onDcMessage;

      pc.onicecandidate = (evt) => {
        if (!evt.candidate || !state.publishSignal) return;
        state.publishSignal("ice", {
          candidate: evt.candidate.candidate,
          sdpMid: evt.candidate.sdpMid,
          sdpMLineIndex: evt.candidate.sdpMLineIndex,
        });
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          state.gameplayEnabled = false;
          if (typeof onConnectionState === "function") onConnectionState("Connection failed");
        }
      };

      await buildAndPublishOffer(pc);
      const retryOffer = () => {
        if (!state.active || !state.pc || state.pc.currentRemoteDescription) return;
        if (state.publishSignal) state.publishSignal("host_offer", { sdp: state.offerSdp });
        state.offerRetryTO = setTimeout(retryOffer, 1000);
      };
      state.offerRetryTO = setTimeout(retryOffer, 1000);
    }

    async function handleSignal(d){
      if (!state.active || !state.pc) return;
      if (d.t === "join_hello") {
        state.helloSeen = true;
        if (!state.offerSdp) {
          await buildAndPublishOffer(state.pc);
        } else if (state.publishSignal) {
          state.publishSignal("host_offer", { sdp: state.offerSdp });
        }
        return;
      }
      if (d.t === "join_answer" && d.sdp && !state.pc.currentRemoteDescription) {
        try {
          await state.pc.setRemoteDescription({ type: "answer", sdp: d.sdp });
          if (typeof onConnectionState === "function") onConnectionState("Connecting...");
        } catch (_) {}
        return;
      }
      if (d.t === "ice" && d.candidate) {
        try {
          await state.pc.addIceCandidate({
            candidate: d.candidate,
            sdpMid: d.sdpMid,
            sdpMLineIndex: d.sdpMLineIndex,
          });
        } catch (_) {}
        return;
      }
      if (d.t === "abort") {
        state.gameplayEnabled = false;
        if (typeof onConnectionState === "function") onConnectionState("Aborted");
      }
    }

    function sendControl(name, extra){
      if (!state.active || !state.dc || state.dc.readyState !== "open") return false;
      try {
        state.dc.send(JSON.stringify(Object.assign({ t: "control", name, ts: Date.now() }, extra || {})));
        return true;
      } catch (_) {
        return false;
      }
    }

    function reset(){
      state.active = false;
      cleanupPeer();
    }

    return {
      start,
      handleSignal,
      sendControl,
      reset,
      shouldIgnoreRelayImpulses: () => !!(state.active && state.gameplayEnabled),
      getState: () => ({ active: state.active, gameplayEnabled: state.gameplayEnabled }),
    };
  }

  function createFastPathJoinTransport(options){
    const AblyCtor = options && options.ablyCtor;
    const workerBase = String(options && options.workerBase || "");
    const stunServers = options && options.stunServers || [{ urls: "stun:stun.l.google.com:19302" }];
    const tokenTtlMs = Number(options && options.tokenTtlMs) || (3 * 60 * 1000);
    const onStatus = options && options.onStatus;
    const onControl = options && options.onControl;

    const state = {
      active: false,
      roomId: "",
      token: "",
      expiresAt: 0,
      pairRealtime: null,
      pairChannel: null,
      pc: null,
      dc: null,
      gameplayEnabled: false,
      offerSeen: false,
      running: false,
      startedAcked: false,
      startedRetryTO: null,
      helloRetryTO: null,
    };

    function stripOrbPrefix(room){
      return String(room || "").startsWith("orb:") ? String(room).slice(4) : String(room || "");
    }

    function pairRoomName(roomId){
      return "orb:" + stripOrbPrefix(roomId).trim().toUpperCase();
    }

    function setStatus(message){
      if (typeof onStatus === "function") onStatus(message);
    }

    function clearStartedRetry(){
      if (state.startedRetryTO) {
        clearTimeout(state.startedRetryTO);
        state.startedRetryTO = null;
      }
    }

    function clearHelloRetry(){
      if (state.helloRetryTO) {
        clearTimeout(state.helloRetryTO);
        state.helloRetryTO = null;
      }
    }

    function cleanup(){
      clearStartedRetry();
      clearHelloRetry();
      try { if (state.pairChannel) state.pairChannel.unsubscribe(); } catch (_) {}
      try { if (state.pairChannel) state.pairChannel.detach(); } catch (_) {}
      try { if (state.pairRealtime) state.pairRealtime.close(); } catch (_) {}
      try { if (state.dc) state.dc.close(); } catch (_) {}
      try { if (state.pc) state.pc.close(); } catch (_) {}
      state.pairChannel = null;
      state.pairRealtime = null;
      state.pc = null;
      state.dc = null;
      state.gameplayEnabled = false;
      state.offerSeen = false;
      state.startedAcked = false;
    }

    function buildSignal(t, extra){
      return Object.assign({
        t,
        room: state.roomId,
        token: state.token,
        nonce: Math.random().toString(16).slice(2, 10),
        ts: Date.now(),
      }, extra || {});
    }

    function publishSignal(t, extra){
      if (!state.pairChannel) return false;
      state.pairChannel.publish("pair", buildSignal(t, extra));
      return true;
    }

    function signalValid(d){
      if (!d || typeof d !== "object") return false;
      if (!state.active) return false;
      if (String(d.room || "") !== state.roomId) return false;
      if (String(d.token || "") !== state.token) return false;
      if (Date.now() > state.expiresAt) return false;
      return true;
    }

    async function connectSignalChannel(roomId){
      const authUrl = workerBase + "/token?room=" + encodeURIComponent(stripOrbPrefix(pairRoomName(roomId))) + "&clientId=" + encodeURIComponent("phone-lan-" + Math.random().toString(16).slice(2, 6));
      state.pairRealtime = new AblyCtor.Realtime({ authUrl, autoConnect:true });
      state.pairChannel = state.pairRealtime.channels.get(pairRoomName(roomId));
      await new Promise((resolve, reject) => {
        state.pairChannel.attach((err) => err ? reject(err) : resolve());
      });
    }

    function sendControl(name, extra){
      if (!state.dc || state.dc.readyState !== "open") return false;
      try {
        state.dc.send(JSON.stringify(Object.assign({ t: "control", name, ts: Date.now() }, extra || {})));
        return true;
      } catch (_) {
        return false;
      }
    }

    function armStartedHandshake(){
      if (!state.active || !state.running || !state.gameplayEnabled || state.startedAcked) return;
      clearStartedRetry();
      const tick = () => {
        if (!state.active || !state.running || state.startedAcked) {
          clearStartedRetry();
          return;
        }
        sendControl("phone_started");
        state.startedRetryTO = setTimeout(tick, 250);
      };
      tick();
    }

    async function connect(config){
      cleanup();
      state.active = true;
      state.roomId = stripOrbPrefix(config.roomId).trim().toUpperCase();
      state.token = String(config.token || "").trim();
      state.expiresAt = Date.now() + tokenTtlMs;

      await connectSignalChannel(state.roomId);
      const pc = new RTCPeerConnection({ iceServers: stunServers });
      state.pc = pc;

      pc.onicecandidate = (evt) => {
        if (!evt.candidate) return;
        publishSignal("ice", {
          candidate: evt.candidate.candidate,
          sdpMid: evt.candidate.sdpMid,
          sdpMLineIndex: evt.candidate.sdpMLineIndex,
        });
      };

      pc.ondatachannel = (evt) => {
        state.dc = evt.channel;
        state.dc.onopen = async () => {
          const lanSafety = await detectLanSafety(pc);
          state.gameplayEnabled = !!lanSafety.safe;
          setStatus(lanSafety.safe ? ("Connected (" + lanSafety.label + ")") : lanSafety.label);
          if (state.running) armStartedHandshake();
        };
        state.dc.onclose = () => {
          state.gameplayEnabled = false;
          setStatus("Disconnected");
        };
        state.dc.onmessage = (evtMsg) => {
          let d = null;
          try { d = JSON.parse(String(evtMsg.data || "")); } catch (_) { return; }
          if (!d || d.t !== "control") return;
          if (d.name === "phone_started_ack") {
            state.startedAcked = true;
            clearStartedRetry();
            return;
          }
          if (typeof onControl === "function") onControl(d.name, d);
        };
      };

      state.pairChannel.subscribe("pair", async (msg) => {
        const d = (msg && msg.data) ? msg.data : {};
        if (!signalValid(d)) return;
        if (d.t === "host_offer" && d.sdp) {
          state.offerSeen = true;
          clearHelloRetry();
          try {
            await pc.setRemoteDescription({ type: "offer", sdp: d.sdp });
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            publishSignal("join_answer", { sdp: answer.sdp });
            setStatus("Answer sent; connecting...");
          } catch (_) {
            setStatus("Offer/answer failed");
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
          state.gameplayEnabled = false;
          setStatus("Aborted");
        }
      });

      publishSignal("join_hello", {});
      const retryHello = () => {
        if (!state.active || state.offerSeen || !state.pairChannel) return;
        publishSignal("join_hello", {});
        state.helloRetryTO = setTimeout(retryHello, 1000);
      };
      state.helloRetryTO = setTimeout(retryHello, 1000);
      setStatus("Join hello sent");
      return true;
    }

    function setRunning(isRunning){
      state.running = !!isRunning;
      if (state.running) armStartedHandshake();
      else clearStartedRetry();
    }

    function sendImpulse(payload){
      if (!state.active || !state.gameplayEnabled || !state.dc || state.dc.readyState !== "open") return false;
      try {
        state.dc.send(JSON.stringify({ t: "impulse", payload }));
        return true;
      } catch (_) {
        return false;
      }
    }

    function disconnect(){
      state.active = false;
      cleanup();
    }

    function parseJoinParamsFromUrl(url){
      try {
        const u = new URL(url);
        if (u.searchParams.get("join") !== "1") return null;
        const roomId = stripOrbPrefix((u.searchParams.get("room") || "").trim());
        const token = (u.searchParams.get("token") || "").trim();
        if (!roomId || !token) return null;
        return { roomId, token };
      } catch (_) {
        return null;
      }
    }

    return {
      connect,
      disconnect,
      setRunning,
      sendImpulse,
      shouldUseDirect: () => !!(state.active && state.gameplayEnabled),
      parseJoinParamsFromUrl,
      getState: () => ({ active: state.active, gameplayEnabled: state.gameplayEnabled, roomId: state.roomId }),
    };
  }

  global.createFastPathHostTransport = createFastPathHostTransport;
  global.createFastPathJoinTransport = createFastPathJoinTransport;
})(window);
