(function(global){
  function createReceiverTransport(options){
    const workerBase = String(options && options.workerBase || "");
    const ablyCtor = options && options.ablyCtor;

    let realtime = null;
    let channel = null;

    function stripOrbPrefix(room){
      return String(room || "").startsWith("orb:") ? String(room).slice(4) : String(room || "");
    }

    function disconnect(){
      try { if (channel) channel.unsubscribe(); } catch(_) {}
      try { if (channel) channel.detach(); } catch(_) {}
      try { if (realtime) realtime.close(); } catch(_) {}
      channel = null;
      realtime = null;
    }

    function publishControl(name, data){
      if (!channel) return false;
      channel.publish(name, data);
      return true;
    }

    function connect(config){
      const roomChannel = String(config && config.roomChannel || "");
      const authUrl = workerBase + "/token?room=" + encodeURIComponent(stripOrbPrefix(roomChannel)) + "&v=" + Date.now();

      disconnect();

      realtime = new ablyCtor.Realtime({ authUrl, echoMessages:false });

      if (config && config.onConnectionConnected) {
        realtime.connection.on("connected", () => config.onConnectionConnected(roomChannel));
      }
      if (config && config.onConnectionFailed) {
        realtime.connection.on("failed", (state) => config.onConnectionFailed(state, roomChannel));
      }
      if (config && config.onConnectionDisconnected) {
        realtime.connection.on("disconnected", () => config.onConnectionDisconnected(roomChannel));
      }

      channel = realtime.channels.get(roomChannel);
      channel.attach((err) => {
        if (config && config.onAttached) config.onAttached(err, roomChannel);
      });

      if (config && config.onMessage) {
        channel.subscribe("orb", (msg) => {
          config.onMessage((msg && msg.data) ? msg.data : {}, msg);
        });
      }

      return { realtime, channel };
    }

    return {
      connect,
      disconnect,
      publishControl,
      getChannel: () => channel,
      getRealtime: () => realtime,
    };
  }

  global.createReceiverTransport = createReceiverTransport;
})(window);
