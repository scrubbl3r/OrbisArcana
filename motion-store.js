(function(global){
  function createMotionStore(){
    let state = {
      receivedAtMs: 0,
      packet: null,
      motion: {
        energy01: 0,
        groove01: 0,
        dynamics01: 0,
        smooth01: 0,
        speed01: 0,
        shake01: 0,
        lift01: 0,
        locked: false,
        hz: 0,
        shakeHit: false,
        shakeMeter01: 0,
        shakeDisplayValue: 0,
        sd: null,
        shieldRGB: null,
        shieldAxis: null,
        accel: null,
        rotationRate: null,
      },
      direction: {
        vector: null,
        yawDeg: null,
        tiltDeg: null,
      },
      energyBank: {
        points: 0,
        level01: 0,
      },
    };
    const subscribers = new Set();

    function snapshot(){
      return state;
    }

    function notify(){
      const next = snapshot();
      subscribers.forEach((subscriber) => subscriber(next));
    }

    function subscribe(subscriber){
      subscribers.add(subscriber);
      return function unsubscribe(){
        subscribers.delete(subscriber);
      };
    }

    function reset(){
      state = {
        receivedAtMs: 0,
        packet: null,
        motion: {
          energy01: 0,
          groove01: 0,
          dynamics01: 0,
          smooth01: 0,
          speed01: 0,
          shake01: 0,
          lift01: 0,
          locked: false,
          hz: 0,
          shakeHit: false,
          shakeMeter01: 0,
          shakeDisplayValue: 0,
          sd: null,
          shieldRGB: null,
          shieldAxis: null,
          accel: null,
          rotationRate: null,
        },
        direction: {
          vector: null,
          yawDeg: null,
          tiltDeg: null,
        },
        energyBank: {
          points: 0,
          level01: 0,
        },
      };
      notify();
    }

    function publish(nextState){
      state = nextState;
      notify();
    }

    return {
      getState: snapshot,
      publish,
      reset,
      subscribe,
    };
  }

  global.createMotionStore = createMotionStore;
})(window);
