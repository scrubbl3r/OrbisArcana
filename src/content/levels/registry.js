import { LEVEL01 } from "./level01.js";
import { LEVEL_MVP } from "./level-mvp/level-mvp.js";
import { ORB_STAGE_LEVEL } from "./orb-stage-level/orb-stage-level.js";

export const LEVELS = Object.freeze([
  LEVEL01,
  LEVEL_MVP,
  ORB_STAGE_LEVEL,
]);

export const LEVELS_BY_ID = Object.freeze(
  LEVELS.reduce((acc, level) => {
    const id = String(level && level.id || "").trim();
    if (!id) return acc;
    acc[id] = level;
    return acc;
  }, Object.create(null))
);

export function getLevelById(id = "") {
  const key = String(id || "").trim();
  return key && LEVELS_BY_ID[key] ? LEVELS_BY_ID[key] : null;
}
