import { buildStarsFieldModel } from "./stars-field.js?v=20260425j";

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
