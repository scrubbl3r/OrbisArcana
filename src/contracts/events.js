/**
 * Event contract constants (SSOT for event names).
 *
 * Payload typedefs below document the most commonly used events.
 * This file is intentionally lightweight and JS-only (no runtime schema validation yet).
 */

/**
 * @typedef {Object} InputShakeTriggeredPayload
 * @property {number} atMs
 * @property {string} [code] Raw directional code (`U`,`D`,`L`,`R`,`F`,`B`) when available.
 * @property {string} [group] Direction group (`UD`,`LR`,`FB`) when available.
 */
export const EVT_INPUT_SHAKE_TRIGGERED = "input.shake_triggered";

/**
 * @typedef {Object} FlatSpinWindowPayload
 * @property {string} axis Dominant axis (`x`,`y`,`z`)
 * @property {number} atMs
 * @property {string} [reason] Present on close events (for example `reset`, `lost_dominance`)
 */
export const EVT_SPELL_WINDOW_FLAT_SPIN_OPENED = "spell_window.flat_spin_opened";
export const EVT_SPELL_WINDOW_FLAT_SPIN_CLOSED = "spell_window.flat_spin_closed";

/**
 * @typedef {Object} VoiceSpellCastPayload
 * @property {string} spellId Canonical spell id
 * @property {string} [intent] Spell intent/category
 * @property {string} [axis] Axis (`x`,`y`,`z`)
 * @property {string} [slot] Slot/group (`UD`,`LR`,`FB`)
 * @property {string} [axisSpell] Selected axis spell token id for wake-window casts
 * @property {string} [wakeWindowSpell] Selected wake-window token id
 * @property {number} [atMs]
 * @property {number} [floatGraceMs] Optional explicit grace override
 * @property {string} [trigger] Trigger source (for example `shake_detonation`)
 * @property {string} [phrase] Recognized phrase/display text
 * @property {number} [confidence] Recognition confidence (0..1)
 * @property {string} [directionGroup] Direction group (`UD`,`LR`,`FB`) for shake detonation casts
 */

/**
 * @typedef {Object} VoiceSpellLoadedPayload
 * @property {string} spellId Canonical spell id
 * @property {string} axis Axis (`x`,`y`,`z`)
 * @property {string} slot Slot/group (`UD`,`LR`,`FB`)
 * @property {string} [axisSpell] Selected axis spell token id for wake-window loads
 * @property {string} [wakeWindowSpell] Selected wake-window token id
 * @property {number} [atMs]
 */

/**
 * @typedef {Object} VoiceSpellRejectedPayload
 * @property {string} [spellId]
 * @property {string} reason Rejection reason code
 * @property {number} [atMs]
 * @property {string} [axis]
 * @property {string} [slot]
 * @property {number} [remainingMs]
 */
export const EVT_VOICE_SET_MODE = "voice.set_mode";
/**
 * @typedef {Object} VoiceTokenDetectedPayload
 * @property {string} token Normalized detected keyword token
 * @property {number} confidence 0..1 confidence estimate
 * @property {number} atMs
 * @property {string} providerId Usually `kws`
 * @property {string} source Usually `kws`
 */
export const EVT_VOICE_TOKEN_DETECTED = "voice.token_detected";
/**
 * @typedef {Object} VoiceKwsSpellCandidatePayload
 * @property {string|null} spellId
 * @property {boolean} matched
 * @property {string[]} tokens
 * @property {string} phrase
 * @property {number} confidence
 * @property {boolean} [suppressed]
 * @property {number} atMs
 * @property {string} providerId Usually `kws`
 * @property {string} source Usually `kws`
 */
export const EVT_VOICE_KWS_SPELL_CANDIDATE = "voice.kws_spell_candidate";
export const EVT_VOICE_SPELL_DETECTED = "voice.spell_detected";
export const EVT_VOICE_SPELL_REJECTED = "voice.spell_rejected";
export const EVT_VOICE_AXIS_SELECTED = "voice.axis_selected";
export const EVT_VOICE_SPELL_LOADED = "voice.spell_loaded";
export const EVT_VOICE_SPELL_CAST = "voice.spell_cast";

/**
 * @typedef {Object} PickupCollectedPayload
 * @property {string} id Pickup instance id
 * @property {string} type Pickup type (currently `energy_globe`)
 * @property {number} atMs
 * @property {number} [xNorm]
 * @property {number} [yW]
 */
export const EVT_PICKUP_COLLECTED = "pickup.collected";

/**
 * @typedef {Object} ResourcesEnergyBankChangedPayload
 * @property {number} bankPts
 * @property {number} capPts
 * @property {number} atMs
 * Legacy event id currently used: `energy.bank_changed`.
 */
export const EVT_RESOURCES_ENERGY_BANK_CHANGED = "energy.bank_changed";

/**
 * @typedef {Object} ResourcesGlobeInventoryChangedPayload
 * @property {number} stored Stored globe count
 * @property {number} atMs
 * Legacy event id currently used: `energy.globe_inventory_changed`.
 */
export const EVT_RESOURCES_GLOBE_INVENTORY_CHANGED = "energy.globe_inventory_changed";
export const EVT_RESOURCES_SHAKE_SPENT = "energy.shake_spent";
export const EVT_RESOURCES_GLOBE_SPENT = "energy.globe_spent";

/**
 * @typedef {Object} OrbLifecyclePayload
 * @property {number} atMs
 * @property {number} [health]
 */
export const EVT_ORB_VISUAL_STATE_CHANGED = "orb.visual_state_changed";
export const EVT_ORB_IMPACT_DETECTED = "orb.impact_detected";
export const EVT_ORB_DAMAGE_BLOCKED = "orb.damage_blocked";
export const EVT_ORB_DAMAGE_APPLIED = "orb.damage_applied";
export const EVT_ORB_HEALTH_CHANGED = "orb.health_changed";
export const EVT_ORB_DIED = "orb.died";
export const EVT_ORB_SHATTER_STARTED = "orb.shatter_started";
export const EVT_ORB_SHATTER_PIECE_SPAWNED = "orb.shatter_piece_spawned";
export const EVT_ORB_SHATTER_COMPLETE = "orb.shatter_complete";
export const EVT_ORB_HEAL_BLOCKED = "orb.heal_blocked";
export const EVT_ORB_HEALED = "orb.healed";
export const EVT_ORB_REVIVED = "orb.revived";
export const EVT_ORB_FLOAT_GRACE_GRANT = "orb.float_grace_grant";
export const EVT_ORB_FLOAT_GRACE_CLEAR = "orb.float_grace_clear";
