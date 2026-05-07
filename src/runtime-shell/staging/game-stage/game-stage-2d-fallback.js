const GAME_STAGE_2D_ORB_FALLBACK_PARAM = "gameStage2dOrb";
const GAME_STAGE_2D_GLOBE_FALLBACK_PARAM = "gameStage2dGlobe";

export const GAME_STAGE_ORB_FALLBACK_MARKUP = `
  <div class="gameStageOrbLayer" aria-hidden="true">
    <div class="orbWrap gameStageOrbWrap" data-game-stage-orb-wrap="true">
      <div class="origin" aria-hidden="true">
        <div class="electricLayer" data-game-stage-electric-layer="true" aria-hidden="true"></div>
        <div class="flameLayer" data-game-stage-flame-layer="true" aria-hidden="true"></div>
        <div class="shockLayer" data-game-stage-shock-layer="true" aria-hidden="true"></div>
        <div class="shield atOrigin gameStageShield" data-game-stage-shield="true"></div>
        <div class="orb atOrigin" data-game-stage-orb="true"></div>
        <svg class="orbCracks atOrigin" data-game-stage-orb-cracks="true" viewBox="-50 -50 100 100"></svg>
        <div class="orbInterior atOrigin" data-game-stage-orb-interior="true"></div>
        <svg class="orbShards atOrigin" data-game-stage-orb-shards="true" viewBox="-80 -80 160 160"></svg>
      </div>
    </div>
  </div>
`;

export const GAME_STAGE_GLOBE_FALLBACK_MARKUP = `
  <div class="pickupGlobe" data-game-stage-test-globe="true" aria-label="Energy globe"></div>
`;

function readBoolSearchParam(name = "") {
  try {
    const params = new URLSearchParams(globalThis.location && globalThis.location.search || "");
    const raw = String(params.get(name) || "").trim().toLowerCase();
    return raw === "1" || raw === "true" || raw === "on" || raw === "yes";
  } catch (_) {
    return false;
  }
}

export function resolveGameStage2dOrbEnabled({
  level = null,
  enable2dOrb = null,
} = {}) {
  if (typeof enable2dOrb === "boolean") return enable2dOrb;
  const gameStage = level && typeof level.stage === "object" ? level.stage : null;
  if (typeof (gameStage && gameStage.enable2dOrb) === "boolean") {
    return gameStage.enable2dOrb;
  }
  return readBoolSearchParam(GAME_STAGE_2D_ORB_FALLBACK_PARAM);
}

export function resolveGameStage2dGlobeEnabled({
  level = null,
  enable2dGlobe = null,
} = {}) {
  if (typeof enable2dGlobe === "boolean") return enable2dGlobe;
  const gameStage = level && typeof level.stage === "object" ? level.stage : null;
  if (typeof (gameStage && gameStage.enable2dGlobe) === "boolean") {
    return gameStage.enable2dGlobe;
  }
  return readBoolSearchParam(GAME_STAGE_2D_GLOBE_FALLBACK_PARAM);
}
