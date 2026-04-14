import { resolveOrbGraceDefaultTtlMs, resolveOrbGracePayload } from "../../../game-runtime/orb/orb-grace.js";

export function createGameStagingOrbActionBridge({
  runtime = null,
  shieldEl = null,
  patchOrbRuntime = () => {},
  getOrbRuntime = () => null,
  applyOrbTransform = () => {},
  applyGroundLine = () => {},
  groundCenterWorld = () => 0,
  updateDebugReadout = () => {},
  resetInputProcessingState = () => {},
  performanceNow = () => performance.now(),
  clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n) || 0)),
} = {}) {
  return Object.freeze({
    activateBubbleShield({ durationMs = 8000 } = {}) {
      const shellVfx = runtime && runtime.vfx ? runtime.vfx : null;
      if (shellVfx && typeof shellVfx.activateBubbleShield === "function") {
        const result = shellVfx.activateBubbleShield({ durationMs });
        if (result && result.handled) return result;
      }
      if (!shieldEl) return { handled: false };
      shieldEl.classList.add("on");
      shieldEl.style.opacity = "1";
      shieldEl.style.transition = "opacity 120ms linear";
      if (runtime && runtime.bubbleShieldTimer) {
        clearTimeout(runtime.bubbleShieldTimer);
      }
      if (runtime) {
        runtime.bubbleShieldTimer = setTimeout(() => {
          shieldEl.classList.remove("on");
          shieldEl.style.transition = "opacity 420ms linear";
          shieldEl.style.opacity = "0";
          runtime.bubbleShieldTimer = 0;
        }, Math.max(200, Number(durationMs) || 8000));
      }
      return { handled: true };
    },
    applyColorize(payload = {}) {
      const orbColorRuntime = runtime && runtime.orbColorRuntime;
      if (orbColorRuntime && typeof orbColorRuntime.applyColorize === "function") {
        orbColorRuntime.applyColorize(payload);
      }
    },
    clearColorize() {
      const orbColorRuntime = runtime && runtime.orbColorRuntime;
      if (orbColorRuntime && typeof orbColorRuntime.clearColorize === "function") {
        orbColorRuntime.clearColorize();
      }
    },
    teleportOrbToSpawnNeutralizePhysics({
      aboveGroundPx = 0,
      teleportOrbRuntimeToSpawn = null,
    } = {}) {
      const stage = runtime && runtime.stage;
      const orbState = getOrbRuntime();
      if (!stage || !orbState) return { handled: false };
      if (typeof teleportOrbRuntimeToSpawn === "function") {
        const result = teleportOrbRuntimeToSpawn({
          patchOrbRuntime: (patch = {}) => patchOrbRuntime(patch),
          applyOrbTransform: () => applyOrbTransform(),
          worldSystem: stage.worldSystem || null,
          groundCenterWorld: () => groundCenterWorld(),
          phys: stage.phys || {},
          aboveGroundPx,
          nowMs: performanceNow(),
          updateDebugReadout: () => updateDebugReadout(),
        });
        if (result && result.handled) return result;
      }
      const yFloor = groundCenterWorld();
      const yCeil = Number(stage.phys && stage.phys.orbRadiusPx) || 50;
      const lift = Math.max(0, Number(aboveGroundPx) || 0);
      const yTarget = Math.min(yFloor, Math.max(yCeil, yFloor - lift));
      patchOrbRuntime({
        yW: yTarget,
        v: 0,
        onGround: !(yTarget < (yFloor - 0.5)),
        descendMs: 0,
        shieldDescentBlocked: false,
        floatGraceAnchorY: yTarget,
        floatGracePhase: 0,
      });
      applyGroundLine();
      applyOrbTransform();
      if (stage.worldSystem && typeof stage.worldSystem.render === "function") {
        stage.worldSystem.render(performanceNow());
      }
      updateDebugReadout();
      return { handled: true, yTarget };
    },
    grantOrbGrace({
      grace = null,
      grantOrbGraceRuntime = null,
    } = {}) {
      const orbState = getOrbRuntime();
      if (!orbState) return;
      const defaultTtlMs = resolveOrbGraceDefaultTtlMs(runtime && runtime.stage ? runtime.stage.statusConfig : null, 2500);
      const resolvedGrace = resolveOrbGracePayload(grace, { defaultTtlMs });
      if (!resolvedGrace) return;
      if (typeof grantOrbGraceRuntime === "function") {
        grantOrbGraceRuntime({
          patchOrbRuntime: (patch = {}) => patchOrbRuntime(patch),
          getOrbRuntime: () => getOrbRuntime(),
          grace: resolvedGrace,
          durationMs: resolvedGrace.ttlMs,
          defaultTtlMs,
          nowMs: performanceNow(),
        });
        applyOrbTransform();
        return;
      }
      const now = performanceNow();
      const yFloor = groundCenterWorld();
      const yCeil = Number(runtime && runtime.stage && runtime.stage.phys && runtime.stage.phys.orbRadiusPx) || 50;
      const liftPx = Math.max(40, Math.min(180, Number(resolvedGrace.ttlMs) * 0.08));
      const anchorY = clamp((Number(orbState.yW) || yFloor) - liftPx, yCeil, yFloor - 6);
      patchOrbRuntime({
        yW: anchorY,
        v: 0,
        onGround: false,
        floatGraceActive: true,
        floatGraceUntilMs: now + Math.max(50, Number(resolvedGrace.ttlMs) || defaultTtlMs),
        floatGraceAnchorY: anchorY,
        floatGracePhase: Math.random() * Math.PI * 2,
      });
      applyOrbTransform();
    },
  });
}
