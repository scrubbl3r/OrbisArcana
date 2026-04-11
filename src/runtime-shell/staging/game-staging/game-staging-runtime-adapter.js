export function createGameStagingRuntimeAdapter({ refs = {}, level = null } = {}) {
  const stageRefs = Object.freeze({
    physStage: refs.physStage || null,
    stars: refs.stars || null,
    terrain: refs.terrain || null,
    groundLine: refs.groundLine || null,
    orbWrap: refs.orbWrap || null,
    orb: refs.orb || null,
    orbInterior: refs.orbInterior || null,
    orbCracks: refs.orbCracks || null,
    orbShards: refs.orbShards || null,
    testGlobe: refs.testGlobe || null,
    shield: refs.shield || null,
    shockLayer: refs.shockLayer || null,
    flameLayer: refs.flameLayer || null,
    electricLayer: refs.electricLayer || null,
    deathPanel: refs.deathPanel || null,
    tryAgainBtn: refs.tryAgainBtn || null,
    gSlider: refs.gSlider || null,
    gVal: refs.gVal || null,
    dSlider: refs.dSlider || null,
    dVal: refs.dVal || null,
  });

  return Object.freeze({
    level,
    refs: stageRefs,
    getStageElements() {
      return stageRefs;
    },
    getBackdropRefs() {
      return Object.freeze({
        physStage: stageRefs.physStage,
        stars: stageRefs.stars,
        terrain: stageRefs.terrain,
        groundLine: stageRefs.groundLine,
      });
    },
    getOrbVisualRefs() {
      return Object.freeze({
        orbWrap: stageRefs.orbWrap,
        orb: stageRefs.orb,
        orbInterior: stageRefs.orbInterior,
        orbCracks: stageRefs.orbCracks,
        orbShards: stageRefs.orbShards,
        shield: stageRefs.shield,
        shockLayer: stageRefs.shockLayer,
        flameLayer: stageRefs.flameLayer,
        electricLayer: stageRefs.electricLayer,
        deathPanel: stageRefs.deathPanel,
      });
    },
  });
}
