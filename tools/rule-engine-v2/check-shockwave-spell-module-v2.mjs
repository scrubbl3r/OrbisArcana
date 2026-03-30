import { CAST_ACTION_REGISTRY_BY_ID } from "../../src/content/spells/cast-action-registry.js";
import { EVENT_DEFINITIONS_BY_ID } from "../../src/content/spell-rules/event-definitions.js";
import { EVENT_RUNTIME_BINDINGS_BY_ID } from "../../src/content/spell-rules/event-runtime-bindings.js";
import { createSpellActionHandlers } from "../../src/systems/spell-action-handlers.js";
import { createSpellCastExecutor } from "../../src/game-runtime/triggers/spell-cast-executor.js";
import { assertCheck } from "./check-assert-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "shockwave-spell-module:v2";
const PASS_MESSAGE = "shockwave resolves as a first-class event and executes through the canonical spell module hook";

function main() {
  assertCheck(!!EVENT_DEFINITIONS_BY_ID.shockwave, `[${CHECK_TAG}] missing event definition for shockwave`);
  const binding = EVENT_RUNTIME_BINDINGS_BY_ID.shockwave;
  assertCheck(!!binding, `[${CHECK_TAG}] missing runtime binding for shockwave`);
  assertCheck(
    String(binding?.runtime?.castActionId || "") === "shockwave",
    `[${CHECK_TAG}] expected shockwave runtime binding to target castActionId=shockwave`
  );

  let triggerCount = 0;
  const handlers = createSpellActionHandlers({
    executeShockwave: ({ triggerShockwave }) => {
      if (typeof triggerShockwave === "function") triggerShockwave();
      return { handled: true };
    },
    triggerShockwave: () => {
      triggerCount += 1;
    },
  });
  const executor = createSpellCastExecutor({
    castActionRegistryById: CAST_ACTION_REGISTRY_BY_ID,
    handlers,
  });
  const result = executor.execute("shockwave", {
    payload: { trigger: "rule_engine.event", atMs: 1000 },
  });

  assertCheck(result && result.handled === true, `[${CHECK_TAG}] expected shockwave cast action to be handled`);
  assertCheck(triggerCount === 1, `[${CHECK_TAG}] expected shockwave runtime hook to fire once, got ${triggerCount}`);
  reportCheckPass(CHECK_TAG, PASS_MESSAGE);
}

main();
