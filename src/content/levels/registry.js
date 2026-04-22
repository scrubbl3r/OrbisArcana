import { LEVEL01 } from "./level01.js";

export const LEVELS = Object.freeze([
  LEVEL01,
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
