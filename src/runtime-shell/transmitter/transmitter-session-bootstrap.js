export function createTransmitterSessionBootstrap({
  rootWindow = window,
  ablyCtor = null,
  tokenUrl = "",
  workerBase = "",
  lanStunServers = [],
  lanTokenTtlMs = 60000,
  setJoinStatus = () => {},
  hideLanConnecting = () => {},
  onCalibrate = () => {},
} = {}) {
  let ably = null;
  let ablyChannel = null;
  let classicTransmitterRelay = null;
  let classicFastPathJoinTransport = null;

  function stripOrbPrefix(room) {
    return String(room || "").startsWith("orb:") ? String(room).slice(4) : String(room || "");
  }

  function normalizeRoom(input) {
    let room = String(input || "").trim();
    if (!room) room = "orb:test";
    if (!room.includes(":")) room = `orb:${room}`;
    const code = stripOrbPrefix(room).trim();
    if (!code) room = "orb:test";
    return room;
  }

  function parseRoom() {
    const url = new URL(rootWindow.location.href);
    const raw = (url.searchParams.get("room") || "").trim();
    const channelName = normalizeRoom(raw);
    const roomCode = stripOrbPrefix(channelName);
    return { raw, roomCode, channelName };
  }

  function parseJoinParamsFromUrl(raw) {
    try {
      const url = new URL(raw || rootWindow.location.href);
      const room = (url.searchParams.get("room") || "").trim();
      const token = (url.searchParams.get("token") || "").trim();
      if (room && token) return { room, token };
    } catch (_) {}
    return null;
  }

  const roomInfo = parseRoom();

  async function initClassicTransmitterRelay() {
    if (classicTransmitterRelay) return classicTransmitterRelay;
    try {
      await import("./transmitter-relay.js");
      classicTransmitterRelay = (typeof rootWindow.createTransmitterRelay === "function")
        ? rootWindow.createTransmitterRelay({
            tokenUrl,
            ablyCtor,
          })
        : null;
    } catch (error) {
      classicTransmitterRelay = null;
      console.warn("Classic transmitter relay init failed:", error);
    }
    return classicTransmitterRelay;
  }

  async function initClassicFastPathJoinTransport() {
    if (classicFastPathJoinTransport) return classicFastPathJoinTransport;
    try {
      await import("../session/fast-path-transport.js");
      classicFastPathJoinTransport = (typeof rootWindow.createFastPathJoinTransport === "function")
        ? rootWindow.createFastPathJoinTransport({
            ablyCtor,
            workerBase,
            stunServers: lanStunServers,
            tokenTtlMs: lanTokenTtlMs,
            onStatus: (msg) => {
              setJoinStatus(msg);
              if (/Connected|NOT LAN SAFE|Disconnected|Aborted|failed/i.test(String(msg || ""))) {
                hideLanConnecting();
              }
            },
            onControl: (name) => {
              if (name === "calibrate") onCalibrate();
            },
          })
        : null;
    } catch (error) {
      classicFastPathJoinTransport = null;
      console.warn("Classic fast-path join transport init failed:", error);
    }
    return classicFastPathJoinTransport;
  }

  async function connectRelay() {
    const relay = await initClassicTransmitterRelay();
    if (relay && typeof relay.connect === "function") {
      const ok = await relay.connect({
        room: roomInfo.channelName,
        roomCode: roomInfo.roomCode,
        onControlMessage: (data) => {
          if (data && data.calibrate) onCalibrate();
        },
      });
      ably = relay.getRealtime ? relay.getRealtime() : null;
      ablyChannel = relay.getChannel ? relay.getChannel() : null;
      return !!ok;
    }

    try { if (ablyChannel) ablyChannel.detach(); } catch (_) {}
    try { if (ably) ably.close(); } catch (_) {}
    ably = null;
    ablyChannel = null;

    const authUrl =
      `${tokenUrl}?room=${encodeURIComponent(roomInfo.roomCode)}&clientId=${encodeURIComponent(`phone-${Math.random().toString(16).slice(2, 6)}`)}`;

    try {
      const response = await fetch(authUrl, { method: "GET", cache: "no-store" });
      const json = await response.json();
      if (!response.ok || !json.token) return false;
    } catch (_) {
      return false;
    }

    ably = new ablyCtor.Realtime({ authUrl, autoConnect: true });
    ablyChannel = ably.channels.get(roomInfo.channelName);

    await new Promise((resolve) => {
      ablyChannel.attach(() => resolve());
    });

    try { ablyChannel.unsubscribe("ctl"); } catch (_) {}
    ablyChannel.subscribe("ctl", (msg) => {
      const data = (msg && msg.data) ? msg.data : {};
      if (data && data.calibrate) onCalibrate();
    });

    return true;
  }

  function disconnectRelay() {
    if (classicTransmitterRelay && typeof classicTransmitterRelay.disconnect === "function") {
      classicTransmitterRelay.disconnect();
      ably = null;
      ablyChannel = null;
      return;
    }
    try { if (ablyChannel) ablyChannel.detach(); } catch (_) {}
    try { if (ably) ably.close(); } catch (_) {}
    ably = null;
    ablyChannel = null;
  }

  function publishRelay(name, data, callback) {
    if (classicTransmitterRelay && typeof classicTransmitterRelay.publish === "function") {
      const published = classicTransmitterRelay.publish(name, data, callback);
      if (published) return true;
    }
    if (!ablyChannel) return false;
    ablyChannel.publish(name, data, callback);
    return true;
  }

  function getFastPathJoinTransport() {
    return classicFastPathJoinTransport;
  }

  return {
    roomInfo,
    room: roomInfo.channelName,
    roomCode: roomInfo.roomCode,
    stripOrbPrefix,
    parseJoinParamsFromUrl,
    initClassicFastPathJoinTransport,
    getFastPathJoinTransport,
    connectRelay,
    disconnectRelay,
    publishRelay,
  };
}
