import { emitDetectedSpell } from "./check-detected-spell-v2.mjs";
import { emitFlatSpinWindowOpened } from "./check-flat-spin-window-v2.mjs";
import { CHECK_AXES_V2 } from "./check-gesture-constants-v2.mjs";
import { CHECK_SPELL_IDS_V2, CHECK_SPELL_INTENTS_V2 } from "./check-spell-constants-v2.mjs";

export function emitWakeLoadPrelude({
  eventBus,
  nowRef,
  advance,
  wakeWindowToken,
  axis = CHECK_AXES_V2.y,
  axisSpellId = CHECK_SPELL_IDS_V2.pyro,
  axisIntent = CHECK_SPELL_INTENTS_V2.axisSelect,
  wakeIntent = CHECK_SPELL_INTENTS_V2.wakeWindowSelect,
  stepMs = 10,
}) {
  const startAt = Number(nowRef?.value ?? 0);
  emitFlatSpinWindowOpened(eventBus, { axis, atMs: startAt });
  emitDetectedSpell(eventBus, {
    id: axisSpellId,
    intent: axisIntent,
    atMs: startAt,
  });
  advance(stepMs);
  emitDetectedSpell(eventBus, {
    id: wakeWindowToken,
    intent: wakeIntent,
    atMs: Number(nowRef?.value ?? 0),
  });
}

export function emitAxisThenWakeSelection({
  eventBus,
  axisSpellId = CHECK_SPELL_IDS_V2.pyro,
  wakeWindowToken,
  axisIntent = CHECK_SPELL_INTENTS_V2.axisSelect,
  wakeIntent = CHECK_SPELL_INTENTS_V2.wakeWindowSelect,
  axisAtMs = 0,
  wakeAtMs = 0,
  confidence,
}) {
  const withConfidence = confidence === undefined ? {} : { confidence };
  emitDetectedSpell(eventBus, {
    id: axisSpellId,
    intent: axisIntent,
    atMs: Number(axisAtMs),
    ...withConfidence,
  });
  emitDetectedSpell(eventBus, {
    id: wakeWindowToken,
    intent: wakeIntent,
    atMs: Number(wakeAtMs),
    ...withConfidence,
  });
}
