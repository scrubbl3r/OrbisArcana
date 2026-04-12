import { createOrbLifecycleVfxRuntime } from "../../../../src/game-runtime/orb/orb-lifecycle-vfx-runtime.js";
import { createOrbShatterRuntimeController } from "../../../../src/game-runtime/orb/orb-shatter-runtime.js";
import { createOrbShatterRuntime } from "../../../../src/vfx/effects/orb-states/orb-shatter-runtime.js";

function createEventBus() {
  const listenersByType = new Map();
  return {
    on(type, handler) {
      const key = String(type || "");
      if (!listenersByType.has(key)) listenersByType.set(key, new Set());
      const set = listenersByType.get(key);
      set.add(handler);
      return () => {
        try { set.delete(handler); } catch (_) {}
      };
    },
    emit(type, payload) {
      const set = listenersByType.get(String(type || ""));
      if (!set) return;
      for (const handler of Array.from(set)) {
        try { handler(payload); } catch (err) { console.error(err); }
      }
    },
  };
}

export function createOrbShatterPreview({ els } = {}) {
  const eventBus = createEventBus();
  const orbLifecycleVfxRuntime = createOrbLifecycleVfxRuntime({ eventBus });
  const orbShatterRuntime = createOrbShatterRuntime({
    layerEl: els && els.orbShatterLayer,
  });
  const orbShatterController = createOrbShatterRuntimeController({
    root: els && els.previewRoot,
    getOrbEl: () => (els ? els.orb : null),
    getOrbShatterRuntime: () => orbShatterRuntime,
    getOrbColorState: () => null,
    getBaseFillAlpha: () => 0.20,
  });

  let started = false;
  let seedCounter = 1;
  const unsub = [];

  function ensureStarted() {
    if (started) return;
    started = true;
    orbLifecycleVfxRuntime.start();
    unsub.push(eventBus.on("orb.shatter_piece_spawned", (piecePayload) => {
      orbShatterController.spawnShardFx(piecePayload);
    }));
    unsub.push(eventBus.on("orb.shatter_complete", () => {
      orbShatterController.handleOrbShatterComplete();
    }));
    unsub.push(eventBus.on("orb.revived", () => {
      orbShatterController.handleOrbRevived();
    }));
  }

  function clear() {
    ensureStarted();
    orbShatterController.handleOrbRevived();
  }

  function play() {
    ensureStarted();
    orbShatterController.handleOrbDied();
    eventBus.emit("orb.shatter_started", {
      atMs: Date.now(),
      pieceCount: 12,
      seed: 1000 + (seedCounter++),
    });
  }

  function wire() {
    if (els && els.playOrbShatter) {
      els.playOrbShatter.addEventListener("click", play);
    }
  }

  return {
    apply() {},
    clear,
    play,
    wire,
  };
}
