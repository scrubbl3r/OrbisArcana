import { buildRuleEnginePreviewRuntime } from "../../src/content/spell-rules/build-rule-engine-preview-runtime.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "preview-runtime-wake-words-alias-contract:v2";

const runtime = buildRuleEnginePreviewRuntime({
  signals: [
    { id: "spell.rota", sourceEvent: "voice.word_detected", enabled: true },
  ],
  windows: [
    { id: "wake_win", type: "wake_win", enabled: true, defaultArgs: { ttlMs: 1200 } },
  ],
  events: [],
  rules: [
    {
      id: "r_words_precedence",
      on: { all: [{ type: "word", id: "rota" }] },
      then: [{ type: "wake_win", words: ["rota"], spells: ["vectus"] }],
    },
    {
      id: "r_spells_fallback",
      on: { all: [{ type: "word", id: "rota" }] },
      then: [{ type: "wake_win", spells: ["sanctum"] }],
    },
  ],
});

const rules = Array.isArray(runtime?.rules) ? runtime.rules : [];
const wordsPrecedenceRule = rules.find((rule) => rule?.id === "r_words_precedence");
if (!wordsPrecedenceRule || !Array.isArray(wordsPrecedenceRule.actions)) {
  failCheck(CHECK_TAG, "missing normalized r_words_precedence actions");
}
const wordsPrecedenceWake = wordsPrecedenceRule.actions.find((action) => action?.type === "wake_win");
if (!wordsPrecedenceWake) {
  failCheck(CHECK_TAG, "r_words_precedence missing wake_win action");
}
if (JSON.stringify(wordsPrecedenceWake.words) !== JSON.stringify(["rota"])) {
  failCheck(CHECK_TAG, "wake_win words[] must take precedence over spells[] alias in preview runtime");
}
if (JSON.stringify(wordsPrecedenceWake.spells) !== JSON.stringify(wordsPrecedenceWake.words)) {
  failCheck(CHECK_TAG, "preview runtime wake_win must mirror compatibility spells[] from canonical words[]");
}

const spellsFallbackRule = rules.find((rule) => rule?.id === "r_spells_fallback");
if (!spellsFallbackRule || !Array.isArray(spellsFallbackRule.actions)) {
  failCheck(CHECK_TAG, "missing normalized r_spells_fallback actions");
}
const spellsFallbackWake = spellsFallbackRule.actions.find((action) => action?.type === "wake_win");
if (!spellsFallbackWake) {
  failCheck(CHECK_TAG, "r_spells_fallback missing wake_win action");
}
if (JSON.stringify(spellsFallbackWake.words) !== JSON.stringify(["sanctum"])) {
  failCheck(CHECK_TAG, "wake_win spells[] alias must fallback to canonical words[] in preview runtime");
}
if (JSON.stringify(spellsFallbackWake.spells) !== JSON.stringify(["sanctum"])) {
  failCheck(CHECK_TAG, "preview runtime wake_win must preserve spells[] alias payload when sourced from fallback");
}

reportCheckPass(
  CHECK_TAG,
  "preview runtime enforces wake_win words precedence with spells alias fallback semantics"
);
