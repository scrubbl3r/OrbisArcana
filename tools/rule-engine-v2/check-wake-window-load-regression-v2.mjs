import { buildRuleEngineFromOrchestratorV2 } from "../../src/content/interactions-v2/index.js";
import { EVENT_DEFINITIONS } from "../../src/content/spell-rules/event-definitions.js";
import { SIGNAL_DEFINITIONS } from "../../src/content/spell-rules/signal-definitions.js";
import { WINDOW_DEFINITIONS } from "../../src/content/spell-rules/window-definitions.js";
import { EVT_VOICE_SPELL_LOADED } from "../../src/contracts/events.js";
import { createRuleEnginePreviewSystem } from "../../src/systems/rule-engine-preview-system.js";
import { assertCheck } from "./check-assert-v2.mjs";
import { captureCheckEvents } from "./check-capture-v2.mjs";
import { createCheckDispatchSystem } from "./check-dispatch-system-v2.mjs";
import { createCheckEventBus } from "./check-event-bus-v2.mjs";
import { runWithStartedSystem } from "./check-lifecycle-v2.mjs";
import { CHECK_AXES_V2, CHECK_SLOTS_V2 } from "./check-gesture-constants-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { createStoredGlobeResources } from "./check-resources-v2.mjs";
import { CHECK_SPELL_IDS_V2 } from "./check-spell-constants-v2.mjs";
import { wordIdText } from "./check-spell-event-v2.mjs";
import { CHECK_TAGS_V2 } from "./check-tags-v2.mjs";
import { CHECK_MUTABLE_TIME_STARTS_V2 } from "./check-time-constants-v2.mjs";
import { createMutableNow } from "./check-time-v2.mjs";
import { emitDetectedWord, emitPyroBindPrelude } from "./check-wake-sequence-v2.mjs";

const EVT_RULE_ENGINE_ACTION_EXECUTED = "rule_engine.action_executed";
const CHECK_TAG = CHECK_TAGS_V2.wakeLoadRegression;
const PASS_MESSAGE = "pyro spin chain binds FB and loads the slot";

function main() {
  const eventBus = createCheckEventBus();
  const loaded = captureCheckEvents(eventBus, EVT_VOICE_SPELL_LOADED);
  const actions = captureCheckEvents(eventBus, EVT_RULE_ENGINE_ACTION_EXECUTED);
  const resources = createStoredGlobeResources(1);
  const { nowRef, nowMs, advance } = createMutableNow(CHECK_MUTABLE_TIME_STARTS_V2.wakeLoad);
  const preview = createRuleEnginePreviewSystem({
    eventBus,
    schema: {
      signals: SIGNAL_DEFINITIONS,
      windows: WINDOW_DEFINITIONS,
      events: EVENT_DEFINITIONS,
      rules: buildRuleEngineFromOrchestratorV2().rules,
    },
    executeActions: true,
    nowMs,
  });

  const system = createCheckDispatchSystem({
    eventBus,
    nowMs,
    resources,
  });

  const offAction = eventBus.on(EVT_RULE_ENGINE_ACTION_EXECUTED, (payload = {}) => {
    if (String(payload.actionType || "").toLowerCase() !== "bind") return;
    const args = (payload.args && typeof payload.args === "object") ? payload.args : {};
    eventBus.emit("spell.slot_load_requested", {
      wordId: String(args.spell || "").trim().toLowerCase(),
      slot: String(args.slot || "").trim().toUpperCase(),
      atMs: Number(payload.atMs) || nowRef.value,
      trigger: "rule_engine.bind",
    });
  });

  runWithStartedSystem(system, () => {
    preview.start();
    emitPyroBindPrelude({ eventBus, startAtMs: nowRef.value });
    advance(10);
    emitDetectedWord(eventBus, CHECK_SPELL_IDS_V2.rota, nowRef.value);
    preview.stop();
  });
  if (typeof offAction === "function") offAction();

  const bindActions = actions.filter((evt) => String(evt?.actionType || "").toLowerCase() === "bind");
  assertCheck(bindActions.length === 1, `[${CHECK_TAG}] expected one bind action, got ${bindActions.length}`);
  assertCheck(String(bindActions[0]?.args?.spell || "") === "aoe_flame", `[${CHECK_TAG}] expected bind spell aoe_flame`);
  assertCheck(String(bindActions[0]?.args?.slot || "") === CHECK_SLOTS_V2.fb, `[${CHECK_TAG}] expected bind slot FB`);

  assertCheck(loaded.length === 1, `[${CHECK_TAG}] expected one loaded spell from bind, got ${loaded.length}`);
  assertCheck(wordIdText(loaded[0]) === "aoe_flame", `[${CHECK_TAG}] expected loaded word aoe_flame, got ${wordIdText(loaded[0])}`);
  const axis = typeof loaded[0]?.axis === "string" ? loaded[0].axis : "";
  const slot = typeof loaded[0]?.slot === "string" ? loaded[0].slot : "";
  assertCheck(axis === "", `[${CHECK_TAG}] expected no axis payload on direct bind load, got ${axis}`);
  assertCheck(slot === CHECK_SLOTS_V2.fb, `[${CHECK_TAG}] expected slot FB, got ${slot}`);
  reportCheckPass(CHECK_TAG, PASS_MESSAGE);
}

main();
