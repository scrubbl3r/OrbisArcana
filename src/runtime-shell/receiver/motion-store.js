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
        accel: null,
        rotationRate: null,
      },
      spin: {
        vector: null,
        axis: null,
        dominance: 0,
        gap: 0,
        label: null,
        direction: null,
      },
      direction: {
        vector: null,
        yawDeg: null,
        tiltDeg: null,
        code: null,
      },
      presentation: {
        spinColor: null,
      },
      debug: {
        spinVector: null,
        spinAxis: null,
        spinAxisDominance: 0,
        spinAxisGap: 0,
        spinAxisLabel: null,
        spinDirection: null,
        calibOK: null,
        omegaOK: null,
        tag: null,
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
          accel: null,
          rotationRate: null,
        },
        spin: {
          vector: null,
          axis: null,
          dominance: 0,
          gap: 0,
          label: null,
          direction: null,
        },
        direction: {
          vector: null,
          yawDeg: null,
          tiltDeg: null,
          code: null,
        },
        presentation: {
          spinColor: null,
        },
        debug: {
          spinVector: null,
          spinAxis: null,
          spinAxisDominance: 0,
          spinAxisGap: 0,
          spinAxisLabel: null,
          spinDirection: null,
          calibOK: null,
          omegaOK: null,
          tag: null,
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
