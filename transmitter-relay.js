(function(global){
  function createTransmitterRelay(options){
    const tokenUrl = String(options && options.tokenUrl || "");
    const ablyCtor = options && options.ablyCtor;

    let realtime = null;
    let channel = null;

    async function connect(config){
      const room = String(config && config.room || "");
      const roomCode = String(config && config.roomCode || "");
      const clientId = String(config && config.clientId || ("phone-" + Math.random().toString(16).slice(2, 6)));
      const authUrl =
        tokenUrl +
        "?room=" + encodeURIComponent(roomCode) +
        "&clientId=" + encodeURIComponent(clientId);

      disconnect();

      try {
        const response = await fetch(authUrl, { method: "GET", cache: "no-store" });
        const json = await response.json();
        if (!response.ok || !json.token) return false;
      } catch (_) {
        return false;
      }

      realtime = new ablyCtor.Realtime({ authUrl, autoConnect: true });
      channel = realtime.channels.get(room);

      await new Promise((resolve) => {
        channel.attach(() => resolve());
      });

      try { channel.unsubscribe("ctl"); } catch(_) {}
      if (config && config.onControlMessage) {
        channel.subscribe("ctl", (msg) => {
          config.onControlMessage((msg && msg.data) ? msg.data : {}, msg);
        });
      }

      return true;
    }

    function disconnect(){
      try { if (channel) channel.detach(); } catch(_) {}
      try { if (realtime) realtime.close(); } catch(_) {}
      realtime = null;
      channel = null;
    }

    function publish(name, data, callback){
      if (!channel) return false;
      channel.publish(name, data, callback);
      return true;
    }

    return {
      connect,
      disconnect,
      publish,
      getChannel: () => channel,
      getRealtime: () => realtime,
    };
  }

  global.createTransmitterRelay = createTransmitterRelay;
})(window);
