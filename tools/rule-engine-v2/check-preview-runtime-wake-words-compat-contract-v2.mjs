import { buildRuleEnginePreviewRuntime } from "../../src/content/spell-rules/build-rule-engine-preview-runtime.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import {
  KNOWN_WAKE_WORD_ID_V2,
  KNOWN_WAKE_WORD_SPELL_SELECTOR_V2,
} from "./wake-test-ids-v2.mjs";

const CHECK_TAG = "preview-runtime-wake-words-compat-contract:v2";
const EVT_WORD_DETECTED = "voice.word_detected";
const ACTION_WAKE_WIN = "wake_win";
const WINDOW_WAKE_WIN = "wake_win";
const RULE_WORDS_PRECEDENCE = "r_words_precedence";
const RULE_SPELLS_FALLBACK = "r_spells_fallback";
const OVERRIDE_WORD_ID = "pyro";
const FALLBACK_WORD_ID = "domus";
const PASS_MESSAGE = "preview runtime enforces wake_win words precedence with spells alias fallback semantics";

const runtime = buildRuleEnginePreviewRuntime({
  signals: [
    { id: KNOWN_WAKE_WORD_SPELL_SELECTOR_V2, sourceEvent: EVT_WORD_DETECTED, enabled: true },
  ],
  windows: [
    { id: WINDOW_WAKE_WIN, type: ACTION_WAKE_WIN, enabled: true, defaultArgs: { ttlMs: 1200 } },
  ],
  events: [],
  rules: [
    {
      id: RULE_WORDS_PRECEDENCE,
      on: { all: [{ type: "word", id: KNOWN_WAKE_WORD_ID_V2 }] },
      then: [{ type: ACTION_WAKE_WIN, words: [KNOWN_WAKE_WORD_ID_V2], spells: [OVERRIDE_WORD_ID] }],
    },
    {
      id: RULE_SPELLS_FALLBACK,
      on: { all: [{ type: "word", id: KNOWN_WAKE_WORD_ID_V2 }] },
      then: [{ type: ACTION_WAKE_WIN, spells: [FALLBACK_WORD_ID] }],
    },
  ],
});

const rules = Array.isArray(runtime?.rules) ? runtime.rules : [];
const wordsPrecedenceRule = rules.find((rule) => rule?.id === RULE_WORDS_PRECEDENCE);
if (!wordsPrecedenceRule || !Array.isArray(wordsPrecedenceRule.actions)) {
  failCheck(CHECK_TAG, `missing normalized ${RULE_WORDS_PRECEDENCE} actions`);
}
const wordsPrecedenceWake = wordsPrecedenceRule.actions.find((action) => action?.type === ACTION_WAKE_WIN);
if (!wordsPrecedenceWake) {
  failCheck(CHECK_TAG, `${RULE_WORDS_PRECEDENCE} missing wake_win action`);
}
if (JSON.stringify(wordsPrecedenceWake.words) !== JSON.stringify([KNOWN_WAKE_WORD_ID_V2])) {
  failCheck(CHECK_TAG, "wake_win words[] must take precedence over spells[] alias in preview runtime");
}
if (JSON.stringify(wordsPrecedenceWake.spells) !== JSON.stringify(wordsPrecedenceWake.words)) {
  failCheck(CHECK_TAG, "preview runtime wake_win must mirror compatibility spells[] from canonical words[]");
}

const spellsFallbackRule = rules.find((rule) => rule?.id === RULE_SPELLS_FALLBACK);
if (!spellsFallbackRule || !Array.isArray(spellsFallbackRule.actions)) {
  failCheck(CHECK_TAG, `missing normalized ${RULE_SPELLS_FALLBACK} actions`);
}
const spellsFallbackWake = spellsFallbackRule.actions.find((action) => action?.type === ACTION_WAKE_WIN);
if (!spellsFallbackWake) {
  failCheck(CHECK_TAG, `${RULE_SPELLS_FALLBACK} missing wake_win action`);
}
if (JSON.stringify(spellsFallbackWake.words) !== JSON.stringify([FALLBACK_WORD_ID])) {
  failCheck(CHECK_TAG, "wake_win spells[] alias must fallback to canonical words[] in preview runtime");
}
if (JSON.stringify(spellsFallbackWake.spells) !== JSON.stringify([FALLBACK_WORD_ID])) {
  failCheck(CHECK_TAG, "preview runtime wake_win must preserve spells[] alias payload when sourced from fallback");
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
