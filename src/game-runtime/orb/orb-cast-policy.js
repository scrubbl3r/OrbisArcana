export function getOrbCastBlockReason(orbState = null) {
  if (!orbState || typeof orbState !== "object") return "orb_state_unavailable";
  if (orbState.alive === false) return "dead";
  if (Number(orbState.health) <= 0) return "dead";
  return "";
}

export function getOrbCastGateState(orbState = null) {
  const reason = getOrbCastBlockReason(orbState);
  return {
    allowed: !reason,
    reason: reason || "",
  };
}
