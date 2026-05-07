import { REACTOR_SHAFT } from "./reactor-shaft/reactor-shaft.js";
import { ORB_HANGAR } from "./orb-hangar/orb-hangar.js";
import { normalizeLevelDefinition } from "../../game-runtime/level/normalize-level-definition.js";

export const LEVELS = Object.freeze([
  normalizeLevelDefinition(REACTOR_SHAFT),
  normalizeLevelDefinition(ORB_HANGAR),
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
