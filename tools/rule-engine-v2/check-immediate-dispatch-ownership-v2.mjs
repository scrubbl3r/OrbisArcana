import { RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS } from "../../src/content/spells/spell-runtime-routing.js";
import { EVT_VOICE_SPELL_CAST, EVT_VOICE_SPELL_REJECTED } from "../../src/contracts/events.js";
import { assertCheck } from "./check-assert-v2.mjs";
import { captureCheckEvents } from "./check-capture-v2.mjs";
import { emitDetectedWordAt } from "./check-detected-word-v2.mjs";
import { createCheckDispatchSystem } from "./check-dispatch-system-v2.mjs";
import { createCheckEventBus } from "./check-event-bus-v2.mjs";
import { runWithStartedSystem } from "./check-lifecycle-v2.mjs";
import { CHECK_CONFIDENCE_V2 } from "./check-confidence-constants-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { CHECK_REASONS_V2, hasReason } from "./check-reason-v2.mjs";
import { createStoredGlobeResources } from "./check-resources-v2.mjs";
import { wordIdText } from "./check-spell-event-v2.mjs";
import { CHECK_TAGS_V2 } from "./check-tags-v2.mjs";
import { CHECK_FIXED_TIMES_V2 } from "./check-time-constants-v2.mjs";
import { createFixedNowMs } from "./check-time-v2.mjs";
import { asLowerText } from "./text-utils-v2.mjs";

// Verifies immediate word ownership routes to dispatch/reject behavior as expected.
const CHECK_TAG = CHECK_TAGS_V2.immediateOwnership;
const PASS_MESSAGE = "immediate spell dispatch ownership contract holds";

function detectWord({ ruleEngineEnabled, wordId }) {
  const resolvedWordId = String(wordId || "").trim().toLowerCase();
  const eventBus = createCheckEventBus();
  const casts = captureCheckEvents(eventBus, EVT_VOICE_SPELL_CAST);
  const rejects = captureCheckEvents(eventBus, EVT_VOICE_SPELL_REJECTED);
  const system = createCheckDispatchSystem({
    eventBus,
    nowMs: createFixedNowMs(CHECK_FIXED_TIMES_V2.immediateOwnership),
    resources: createStoredGlobeResources(0),
    ruleEngineEnabled,
  });
  runWithStartedSystem(system, () => {
    emitDetectedWordAt(eventBus, {
      id: resolvedWordId,
      intent: `spell.${resolvedWordId}`,
      confidence: CHECK_CONFIDENCE_V2.medium,
      atMs: CHECK_FIXED_TIMES_V2.immediateOwnership,
    });
  });
  return { casts, rejects };
}
function main() {
  const ownedImmediate = (Array.isArray(RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS)
    ? RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS
    : [])
    .map((id) => asLowerText(id))
    .filter(Boolean);
  assertCheck(ownedImmediate.length > 0, `[${CHECK_TAG}] expected non-empty RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS`);

  for (const wordId of ownedImmediate) {
    const withRuleEngine = detectWord({ ruleEngineEnabled: true, wordId });
    assertCheck(withRuleEngine.casts.length === 0, `[${CHECK_TAG}] expected 0 casts when ruleEngineEnabled=true for ${wordId}, got ${withRuleEngine.casts.length}`);
    assertCheck(
      hasReason(withRuleEngine.rejects, CHECK_REASONS_V2.ruleEngineOwnedImmediateSpell),
      `[${CHECK_TAG}] expected ${CHECK_REASONS_V2.ruleEngineOwnedImmediateSpell} reject for ${wordId}`
    );

    const withoutRuleEngine = detectWord({ ruleEngineEnabled: false, wordId });
    assertCheck(withoutRuleEngine.casts.length === 1, `[${CHECK_TAG}] expected 1 cast when ruleEngineEnabled=false for ${wordId}, got ${withoutRuleEngine.casts.length}`);
    assertCheck(wordIdText(withoutRuleEngine.casts[0]) === wordId, `[${CHECK_TAG}] unexpected cast wordId for ${wordId}`);
  }

  reportCheckPass(CHECK_TAG, PASS_MESSAGE);
}

main();
