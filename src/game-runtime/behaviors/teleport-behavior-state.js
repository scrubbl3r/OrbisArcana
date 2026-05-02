import { TELEPORT_BEHAVIOR_DEFAULT } from "./teleport-behavior-default.js?v=20260501a";

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  const f = Number.isFinite(Number(fallback)) ? Number(fallback) : min;
  return Math.max(min, Math.min(max, Number.isFinite(n) ? n : f));
}

function boolValue(value, fallback) {
  return typeof value === "boolean" ? value : !!fallback;
}

function completionModeValue(value, fallback) {
  const mode = String(value || fallback || "").trim().toLowerCase();
  return mode === "grace" || mode === "none" || mode === "spawn_idle" ? mode : "spawn_idle";
}

export function buildTeleportBehaviorConfig(overrides = null) {
  const source = overrides && typeof overrides === "object" ? overrides : {};
  return Object.freeze({
    cameraTravelMs: Math.round(clampNumber(
      source.cameraTravelMs ?? source.orbTeleportCameraTravelMs,
      0,
      8000,
      TELEPORT_BEHAVIOR_DEFAULT.cameraTravelMs
    )),
    cameraEasing: String(source.cameraEasing || TELEPORT_BEHAVIOR_DEFAULT.cameraEasing),
    freezeDuringTeleport: boolValue(source.freezeDuringTeleport, TELEPORT_BEHAVIOR_DEFAULT.freezeDuringTeleport),
    teleportAfterFadeOut: boolValue(source.teleportAfterFadeOut, TELEPORT_BEHAVIOR_DEFAULT.teleportAfterFadeOut),
    completionMode: completionModeValue(source.completionMode, TELEPORT_BEHAVIOR_DEFAULT.completionMode),
    grantGraceOnComplete: boolValue(source.grantGraceOnComplete, TELEPORT_BEHAVIOR_DEFAULT.grantGraceOnComplete),
  });
}
