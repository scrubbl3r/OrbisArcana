import { resolveOrbGraceDefaultTtlMs, resolveOrbGracePayload } from "../../../game-runtime/orb/orb-grace.js";

export function createOrbStageActionBridge({
  runtime = null,
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
    playFlameAoe(payload = {}) {
      const shellVfx = runtime && runtime.vfx ? runtime.vfx : null;
      if (shellVfx && typeof shellVfx.playFlameAoe === "function") {
        return shellVfx.playFlameAoe(payload);
      }
      return { handled: false };
    },
    activateBubbleShield({ durationMs = 8000 } = {}) {
      const shellVfx = runtime && runtime.vfx ? runtime.vfx : null;
      if (shellVfx && typeof shellVfx.activateBubbleShield === "function") {
        const result = shellVfx.activateBubbleShield({ durationMs });
        if (result && result.handled) return result;
      }
      return { handled: false };
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
    teleportOrbToSpawnNeutralizePhysics(options = {}) {
      const payload = (typeof options === "number")
        ? { aboveGroundPx: options }
        : (options && typeof options === "object" ? options : {});
      const {
        aboveGroundPx = 0,
        teleportOrbRuntimeToSpawn = null,
        spawnPoint = null,
        resolveSpawnPoint = null,
      } = payload;
      const stage = runtime && runtime.stage;
      const orbState = getOrbRuntime();
      if (!stage || !orbState) return { handled: false };
      if (typeof teleportOrbRuntimeToSpawn === "function") {
        const result = teleportOrbRuntimeToSpawn({
          patchOrbRuntime: (patch = {}) => patchOrbRuntime(patch),
          applyOrbTransform: () => applyOrbTransform(),
          worldSystem: stage.worldSystem || null,
          spawnPoint,
          resolveSpawnPoint,
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
      const resolvedSpawnPoint = (
        spawnPoint && Number.isFinite(Number(spawnPoint.xW)) && Number.isFinite(Number(spawnPoint.yW))
      )
        ? {
            xW: Number(spawnPoint.xW),
            yW: Number(spawnPoint.yW),
          }
        : (typeof resolveSpawnPoint === "function" ? resolveSpawnPoint() : null);
      const hasResolvedSpawn = resolvedSpawnPoint
        && Number.isFinite(Number(resolvedSpawnPoint.xW))
        && Number.isFinite(Number(resolvedSpawnPoint.yW));
      const yTarget = hasResolvedSpawn
        ? Math.max(yCeil, Number(resolvedSpawnPoint.yW) - lift)
        : Math.min(yFloor, Math.max(yCeil, yFloor - lift));
      patchOrbRuntime({
        ...(hasResolvedSpawn ? { xW: Number(resolvedSpawnPoint.xW) } : {}),
        yW: yTarget,
        v: 0,
        vx: 0,
        steerIntentX: 0,
        steerActive: false,
        onGround: hasResolvedSpawn ? false : !(yTarget < (yFloor - 0.5)),
        descendMs: 0,
        shieldDescentBlocked: false,
        floatGraceAnchorY: yTarget,
        floatGracePhase: 0,
        teleportHoldAnchorY: yTarget,
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
        floatGraceUntilMs: resolvedGrace.persistent ? 0 : now + Math.max(50, Number(resolvedGrace.ttlMs) || defaultTtlMs),
        floatGracePersistent: !!resolvedGrace.persistent,
        floatGraceSource: String(resolvedGrace.source || ""),
        floatGraceSuppressInput: !!resolvedGrace.suppressInput,
        floatGraceBreakOnLift: resolvedGrace.breakOnLift !== false,
        floatGraceBreakOnMotion: resolvedGrace.breakOnMotion !== false,
        floatGraceStartedAtMs: now,
        floatGraceMinBreakMs: Math.max(0, Number(resolvedGrace.minBreakMs) || 0),
        floatGraceAnchorY: anchorY,
        floatGracePhase: Math.random() * Math.PI * 2,
      });
      applyOrbTransform();
    },
  });
}
