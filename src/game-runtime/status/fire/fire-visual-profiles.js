export const FIRE_VISUAL_PROFILE_SPELLFIRE = "spellfire";
export const FIRE_VISUAL_PROFILE_ENVIRONMENT = "environment";
export const FIRE_VISUAL_PROFILE_LAVA = "lava";

export const FIRE_VISUAL_PROFILES = Object.freeze({
  [FIRE_VISUAL_PROFILE_SPELLFIRE]: Object.freeze({
    id: FIRE_VISUAL_PROFILE_SPELLFIRE,
    tintHex: 0xff7a18,
    coreHex: 0xfff0a0,
    smokeAlpha: 0.18,
    emberRate: 0.65,
    flameHeightBo: 0.85,
    flickerHz: 9,
  }),
  [FIRE_VISUAL_PROFILE_ENVIRONMENT]: Object.freeze({
    id: FIRE_VISUAL_PROFILE_ENVIRONMENT,
    tintHex: 0xff5a12,
    coreHex: 0xffcf73,
    smokeAlpha: 0.28,
    emberRate: 0.45,
    flameHeightBo: 0.55,
    flickerHz: 6,
  }),
  [FIRE_VISUAL_PROFILE_LAVA]: Object.freeze({
    id: FIRE_VISUAL_PROFILE_LAVA,
    tintHex: 0xff3f0f,
    coreHex: 0xfff4b8,
    smokeAlpha: 0.12,
    emberRate: 0.9,
    flameHeightBo: 0.42,
    flickerHz: 5,
  }),
});

export function resolveFireVisualProfile(profileId = FIRE_VISUAL_PROFILE_SPELLFIRE) {
  const key = String(profileId || FIRE_VISUAL_PROFILE_SPELLFIRE);
  return FIRE_VISUAL_PROFILES[key] || FIRE_VISUAL_PROFILES[FIRE_VISUAL_PROFILE_SPELLFIRE];
}

