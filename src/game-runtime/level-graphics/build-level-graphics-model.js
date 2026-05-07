import { buildStarsFieldModel } from "./stars-field.js?v=20260425l";
import {
  AUTHORED_LEVEL_READ_MODEL_KEY_CAMERA_BOUNDARY_BOX,
  AUTHORED_LEVEL_READ_MODEL_KEY_STARS_FIELD_REGIONS,
  resolveAuthoredLevelReadModelArray,
  resolveAuthoredLevelReadModelBox,
} from "../level/authored-level-read-model.js";

// Performance contract for authored generative level graphics:
// - Build deterministic models from authored semantics once per scene load.
// - Return plain data only; do not create DOM here.
// - Keep model shape stable so stage renderers can mount once and update cheaply.
// - Favor layer/group-level runtime motion over per-item runtime mutation.
export function buildLevelGraphicsModel({
  sceneModel = null,
  summary = null,
} = {}) {
  const readModel = { sceneModel, summary };
  const starsFieldRegions = resolveAuthoredLevelReadModelArray(readModel, AUTHORED_LEVEL_READ_MODEL_KEY_STARS_FIELD_REGIONS);
  return Object.freeze({
    starsField: buildStarsFieldModel({
      regions: starsFieldRegions,
      cameraBoundaryBox: resolveAuthoredLevelReadModelBox(readModel, AUTHORED_LEVEL_READ_MODEL_KEY_CAMERA_BOUNDARY_BOX),
    }),
  });
}
