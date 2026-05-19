export const FIRE_CARD_PROFILE_SMALL_TEARDROP = "smallTeardrop";

export const FIRE_CARD_PROFILES = Object.freeze({
  [FIRE_CARD_PROFILE_SMALL_TEARDROP]: Object.freeze({
    id: FIRE_CARD_PROFILE_SMALL_TEARDROP,
    cardCount: 2,
    widthScale: 6.0,
    heightScale: 9.5,
    yOffsetScale: 0.48,
    zOffset: 18,
    crossAngleRad: 0.32,
    noiseScale: 4.2,
    noiseSpeed: 1.45,
    edgeSoftness: 0.09,
    topFadeStart: 0.58,
    topFadeSoftness: 0.42,
    bottomFadeSoftness: 0.12,
    glowAlpha: 0.42,
  }),
});

export function resolveFireCardProfile(profileId = FIRE_CARD_PROFILE_SMALL_TEARDROP) {
  const key = String(profileId || FIRE_CARD_PROFILE_SMALL_TEARDROP);
  return FIRE_CARD_PROFILES[key] || FIRE_CARD_PROFILES[FIRE_CARD_PROFILE_SMALL_TEARDROP];
}
