import { buildStarsFieldModel } from "./stars-field.js?v=20260425l";

// Performance contract for authored generative level graphics:
// - Build deterministic models from authored semantics once per scene load.
// - Return plain data only; do not create DOM here.
// - Keep model shape stable so stage renderers can mount once and update cheaply.
// - Favor layer/group-level runtime motion over per-item runtime mutation.
export function buildLevelGraphicsModel({
  sceneModel = null,
} = {}) {
  const starsFieldRegions = Array.isArray(sceneModel && sceneModel.starsFieldRegions)
    ? sceneModel.starsFieldRegions
    : [];
  return Object.freeze({
    starsField: buildStarsFieldModel({
      regions: starsFieldRegions,
      cameraBoundaryBox: sceneModel && sceneModel.cameraBoundaryBox ? sceneModel.cameraBoundaryBox : null,
    }),
  });
}
