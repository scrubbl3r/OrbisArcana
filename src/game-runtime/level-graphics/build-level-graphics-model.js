import { buildStarsFieldModel } from "./stars-field.js";

export function buildLevelGraphicsModel({
  sceneModel = null,
} = {}) {
  const starsFieldRegions = Array.isArray(sceneModel && sceneModel.starsFieldRegions)
    ? sceneModel.starsFieldRegions
    : [];
  return Object.freeze({
    starsField: buildStarsFieldModel({
      regions: starsFieldRegions,
    }),
  });
}

