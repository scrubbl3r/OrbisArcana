(function(global){
  function createPairingService(options){
    const AblyCtor = options && options.ablyCtor;
    const QRCodeLib = options && options.qrCodeLib;
    const workerBase = String(options && options.workerBase || "");
    const mobileJoinUrl = options && options.mobileJoinUrl;
    const tokenTtlMs = Number(options && options.tokenTtlMs) || (3 * 60 * 1000);

    const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const state = {
      active: false,
      roomId: "",
      token: "",
      code6: "",
      expiresAt: 0,
      pairRealtime: null,
      pairChannel: null,
      onSignal: null,
    };

    function stripOrbPrefix(room){
      return String(room || "").startsWith("orb:") ? String(room).slice(4) : String(room || "");
    }

    function nowTs(){
      return Date.now();
    }

    function randomTokenBytes(n){
      const arr = new Uint8Array(n);
      if (typeof crypto !== "undefined" && crypto.getRandomValues) {
        crypto.getRandomValues(arr);
        return arr;
      }
      for (let i = 0; i < n; i++) arr[i] = Math.floor(Math.random() * 256);
      return arr;
    }

    function toHex(bytes){
      return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    }

    function nonce8(){
      return toHex(randomTokenBytes(8));
    }

    function randCode(n){
      let s = "";
      for (let i = 0; i < n; i++) {
        s += ROOM_ALPHABET[(Math.random() * ROOM_ALPHABET.length) | 0];
      }
      return s;
    }

    function code6FromTokenHex(tokenHex){
      const tail = String(tokenHex || "").slice(-10);
      const value = parseInt(tail || "0", 16) % 1000000;
      return String(value).padStart(6, "0");
    }

    function pairChannelName(roomId){
      return "orb:" + stripOrbPrefix(roomId).trim().toUpperCase();
    }

    function joinUrl(){
      return mobileJoinUrl(state.roomId, state.token);
    }

    function cleanupSignaling(){
      try { if (state.pairChannel) state.pairChannel.unsubscribe(); } catch (_) {}
      try { if (state.pairChannel) state.pairChannel.detach(); } catch (_) {}
      try { if (state.pairRealtime) state.pairRealtime.close(); } catch (_) {}
      state.pairChannel = null;
      state.pairRealtime = null;
      state.onSignal = null;
    }

    function msgValid(d){
      if (!d || typeof d !== "object") return false;
      if (!state.active) return false;
      if (String(d.room || "") !== state.roomId) return false;
      if (String(d.token || "") !== state.token) return false;
      if (nowTs() > state.expiresAt) return false;
      return true;
    }

    async function connectSignalChannel(roomId){
      const pairRoom = pairChannelName(roomId);
      const authUrl = workerBase + "/token?room=" + encodeURIComponent(stripOrbPrefix(pairRoom)) + "&v=" + Date.now();
      const realtime = new AblyCtor.Realtime({ authUrl, echoMessages:false });
      const channel = realtime.channels.get(pairRoom);
      await new Promise((resolve, reject) => {
        channel.attach((err) => err ? reject(err) : resolve());
      });
      state.pairRealtime = realtime;
      state.pairChannel = channel;
      channel.subscribe("pair", (msg) => {
        const d = (msg && msg.data) ? msg.data : {};
        if (!msgValid(d)) return;
        if (typeof state.onSignal === "function") {
          state.onSignal(d, msg);
        }
      });
    }

    async function renderQr(config){
      if (!config || !config.qrEl) return;
      const url = joinUrl();
      config.qrEl.innerHTML = "";
      if (config.urlTextEl) config.urlTextEl.textContent = url;
      if (config.copyBtn) {
        config.copyBtn.onclick = async () => {
          try {
            await navigator.clipboard.writeText(url);
            config.copyBtn.textContent = "Copied";
          } catch (_) {
            config.copyBtn.textContent = "Nope";
          }
          setTimeout(() => {
            if (config.copyBtn) config.copyBtn.textContent = "Copy";
          }, 800);
        };
      }
      if (!QRCodeLib || !QRCodeLib.toCanvas) {
        config.qrEl.textContent = "QR unavailable";
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = 280;
      canvas.height = 280;
      config.qrEl.appendChild(canvas);
      await QRCodeLib.toCanvas(canvas, url, {
        width: 260,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      });
    }

    function publishSignal(t, extra){
      if (!state.pairChannel) return false;
      const msg = Object.assign({
        t,
        room: state.roomId,
        token: state.token,
        nonce: nonce8(),
        ts: nowTs(),
      }, extra || {});
      state.pairChannel.publish("pair", msg);
      return true;
    }

    async function launch(config){
      reset({ silent: true });
      state.active = true;
      state.roomId = stripOrbPrefix(config && config.roomId ? config.roomId : randCode(8)).trim().toUpperCase() || randCode(8);
      state.token = toHex(randomTokenBytes(16));
      state.code6 = code6FromTokenHex(state.token);
      state.expiresAt = nowTs() + tokenTtlMs;
      state.onSignal = config && config.onSignal;
      await renderQr(config || {});
      await connectSignalChannel(state.roomId);
      return getState();
    }

    function reset(options){
      if (state.active && !options?.silent) {
        publishSignal("abort", { reason: options?.reason || "closed" });
      }
      cleanupSignaling();
      state.active = false;
      state.roomId = "";
      state.token = "";
      state.code6 = "";
      state.expiresAt = 0;
    }

    function getState(){
      return {
        active: state.active,
        roomId: state.roomId,
        token: state.token,
        code6: state.code6,
        expiresAt: state.expiresAt,
        joinUrl: joinUrl(),
      };
    }

    return {
      launch,
      reset,
      publishSignal,
      getState,
      getChannel: () => state.pairChannel,
    };
  }

  global.createPairingService = createPairingService;
})(window);
