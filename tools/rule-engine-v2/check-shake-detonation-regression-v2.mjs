import {
  EVT_INPUT_SHAKE_TRIGGERED,
  EVT_SPELL_SLOT_LOAD_REQUESTED,
  EVT_SPELL_SLOT_CAST_REQUESTED,
  EVT_VOICE_SPELL_CAST,
  EVT_VOICE_SPELL_LOADED,
} from "../../src/contracts/events.js";
import { buildRuleEngineFromOrchestratorV2 } from "../../src/content/interactions-v2/index.js";
import { EVENT_DEFINITIONS } from "../../src/content/spell-rules/event-definitions.js";
import { SIGNAL_DEFINITIONS } from "../../src/content/spell-rules/signal-definitions.js";
import { WINDOW_DEFINITIONS } from "../../src/content/spell-rules/window-definitions.js";
import { createRuleEnginePreviewSystem } from "../../src/systems/rule-engine-preview-system.js";
import { assertCheck } from "./check-assert-v2.mjs";
import { captureCheckEvents } from "./check-capture-v2.mjs";
import { createCheckDispatchSystem } from "./check-dispatch-system-v2.mjs";
import { createCheckEventBus } from "./check-event-bus-v2.mjs";
import { runWithStartedSystem } from "./check-lifecycle-v2.mjs";
import { CHECK_SHAKE_GROUPS_V2 } from "./check-gesture-constants-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { createStoredGlobeResources } from "./check-resources-v2.mjs";
import { CHECK_SPELL_IDS_V2 } from "./check-spell-constants-v2.mjs";
import { wordIdText } from "./check-spell-event-v2.mjs";
import { CHECK_TAGS_V2 } from "./check-tags-v2.mjs";
import { CHECK_MUTABLE_TIME_STARTS_V2 } from "./check-time-constants-v2.mjs";
import { createMutableNow } from "./check-time-v2.mjs";
// Regression guard for shake detonation across fallback and grouped trigger modes.
const CHECK_TAG = CHECK_TAGS_V2.shakeRegression;
const PASS_MESSAGE = "shake detonation works for direct slot loads, grouped shakes, and authored FB-loaded shield casts after spin setup";

function runScenario({ wordId, slot, expectedWordId, shakeGroup = "" }) {
  const eventBus = createCheckEventBus();
  const casts = captureCheckEvents(eventBus, EVT_VOICE_SPELL_CAST);
  const resources = createStoredGlobeResources(1);
  const { nowRef, nowMs, advance } = createMutableNow(CHECK_MUTABLE_TIME_STARTS_V2.shakeDetonation);
  const system = createCheckDispatchSystem({
    eventBus,
    nowMs,
    resources,
    ruleEngineEnabled: false,
    allowLegacyFallbacks: true,
  });
  runWithStartedSystem(system, () => {
    eventBus.emit(EVT_SPELL_SLOT_LOAD_REQUESTED, {
      wordId,
      slot,
      atMs: nowRef.value,
      trigger: "test_direct_load",
    });
    advance(10);
    eventBus.emit(EVT_INPUT_SHAKE_TRIGGERED, { code: "", group: shakeGroup, atMs: nowRef.value });
  });

  const mode = shakeGroup ? `group:${shakeGroup}` : "group:(fallback)";
  assertCheck(casts.length === 1, `[${CHECK_TAG}] expected 1 cast for ${wordId} (${mode}), got ${casts.length}`);
  assertCheck(wordIdText(casts[0]) === expectedWordId, `[${CHECK_TAG}] expected wordId=${expectedWordId}, got ${wordIdText(casts[0])}`);
  const trigger = typeof casts[0]?.trigger === "string" ? casts[0].trigger : "";
  assertCheck(trigger === "shake_detonation", `[${CHECK_TAG}] expected trigger=shake_detonation for ${wordId}`);
}

function runDefaultShockwaveScenario({ shakeGroup }) {
  const eventBus = createCheckEventBus();
  const casts = captureCheckEvents(eventBus, EVT_VOICE_SPELL_CAST);
  const resources = createStoredGlobeResources(1);
  const { nowRef, nowMs } = createMutableNow(CHECK_MUTABLE_TIME_STARTS_V2.shakeDetonation);
  const system = createCheckDispatchSystem({
    eventBus,
    nowMs,
    resources,
    ruleEngineEnabled: false,
    allowLegacyFallbacks: true,
  });

  runWithStartedSystem(system, () => {
    eventBus.emit(EVT_INPUT_SHAKE_TRIGGERED, { code: "", group: shakeGroup, atMs: nowRef.value });
  });

  assertCheck(casts.length === 1, `[${CHECK_TAG}] expected default shockwave cast for ${shakeGroup}, got ${casts.length}`);
  assertCheck(wordIdText(casts[0]) === CHECK_SPELL_IDS_V2.shockwave, `[${CHECK_TAG}] expected default slot to cast shockwave for ${shakeGroup}`);
  assertCheck(String(casts[0]?.slot || "") === shakeGroup, `[${CHECK_TAG}] expected default shockwave slot ${shakeGroup}, got ${String(casts[0]?.slot || "")}`);
}

function attachRuleActionBridge(eventBus) {
  eventBus.on("rule_engine.action_executed", (payload = {}) => {
    const actionType = String(payload.actionType || "").trim().toLowerCase();
    const actionId = String(payload.actionId || "").trim().toLowerCase();
    const args = (payload && typeof payload.args === "object" && payload.args) ? payload.args : {};
    const atMs = Number(payload.atMs) || 0;

    if (actionType === "bind") {
      const slot = String(args.slot || actionId || "").trim().toUpperCase();
      const spell = String(args.spell || "").trim().toLowerCase();
      if (!slot || !spell) return;
      eventBus.emit(EVT_SPELL_SLOT_LOAD_REQUESTED, {
        trigger: "rule_engine.event",
        ruleId: String(payload.ruleId || ""),
        actionId,
        atMs,
        ...args,
        slot,
        spell,
      });
      return;
    }

    if (actionType !== "event" || actionId !== "cast_loaded_fb") return;
    eventBus.emit(EVT_SPELL_SLOT_CAST_REQUESTED, {
      trigger: "rule_engine_loaded_slot",
      ruleId: String(payload.ruleId || ""),
      actionId,
      atMs,
      slot: "FB",
      directionGroup: "FB",
    });
  });
}

function emitDetectedWord(eventBus, wordId, atMs) {
  eventBus.emit("voice.word_detected", {
    word: { id: String(wordId || "") },
    atMs: Number(atMs) || 0,
  });
}

function runAuthoredFbBindScenario() {
  const eventBus = createCheckEventBus();
  const casts = captureCheckEvents(eventBus, EVT_VOICE_SPELL_CAST);
  const loaded = captureCheckEvents(eventBus, EVT_VOICE_SPELL_LOADED);
  const resources = createStoredGlobeResources(1);
  const { nowRef, nowMs, advance } = createMutableNow(CHECK_MUTABLE_TIME_STARTS_V2.shakeDetonation);
  const dispatchSystem = createCheckDispatchSystem({
    eventBus,
    nowMs,
    resources,
  });
  const previewSystem = createRuleEnginePreviewSystem({
    eventBus,
    executeActions: true,
    nowMs,
    schema: {
      signals: SIGNAL_DEFINITIONS,
      windows: WINDOW_DEFINITIONS,
      events: EVENT_DEFINITIONS,
      ...buildRuleEngineFromOrchestratorV2(),
    },
  });

  attachRuleActionBridge(eventBus);

  previewSystem.start();
  runWithStartedSystem(dispatchSystem, () => {
    eventBus.emit("spell_window.spin_opened", { axis: "y", atMs: nowRef.value });
    advance(100);
    emitDetectedWord(eventBus, "pyro", nowRef.value);
    advance(100);
    emitDetectedWord(eventBus, "vectus", nowRef.value);

    assertCheck(loaded.length === 1, `[${CHECK_TAG}] expected authored pyro chain to load FB once, got ${loaded.length}`);
    assertCheck(String(loaded[0]?.slot || "") === "FB", `[${CHECK_TAG}] expected authored pyro chain to load slot FB`);
    assertCheck(String(loaded[0]?.castActionId || "") === "bubble_shield", `[${CHECK_TAG}] expected authored pyro chain to load bubble_shield into FB`);

    // Let the spin-seeded windows expire; the later FB shake must still cast the loaded spell.
    advance(2600);
    eventBus.emit(EVT_INPUT_SHAKE_TRIGGERED, { code: "F", group: "FB", atMs: nowRef.value });
  });
  previewSystem.stop();

  assertCheck(casts.length === 1, `[${CHECK_TAG}] expected one cast from authored FB shake, got ${casts.length}`);
  assertCheck(String(casts[0]?.castActionId || "") === "bubble_shield", `[${CHECK_TAG}] expected authored FB shake to cast bubble_shield`);
  assertCheck(String(casts[0]?.trigger || "") === "rule_engine_loaded_slot", `[${CHECK_TAG}] expected authored FB shake trigger to route via slot cast action`);
  assertCheck(String(casts[0]?.slot || "") === "FB", `[${CHECK_TAG}] expected authored FB shake cast to use FB slot`);
}

function main() {
  runScenario({ wordId: CHECK_SPELL_IDS_V2.rota, slot: CHECK_SHAKE_GROUPS_V2.fb, expectedWordId: CHECK_SPELL_IDS_V2.rota, shakeGroup: CHECK_SHAKE_GROUPS_V2.fallback });
  runScenario({ wordId: CHECK_SPELL_IDS_V2.domus, slot: CHECK_SHAKE_GROUPS_V2.ud, expectedWordId: CHECK_SPELL_IDS_V2.domus, shakeGroup: CHECK_SHAKE_GROUPS_V2.ud });
  runScenario({ wordId: CHECK_SPELL_IDS_V2.rota, slot: CHECK_SHAKE_GROUPS_V2.fb, expectedWordId: CHECK_SPELL_IDS_V2.rota, shakeGroup: CHECK_SHAKE_GROUPS_V2.fb });
  runDefaultShockwaveScenario({ shakeGroup: CHECK_SHAKE_GROUPS_V2.ud });
  runDefaultShockwaveScenario({ shakeGroup: CHECK_SHAKE_GROUPS_V2.lr });
  runDefaultShockwaveScenario({ shakeGroup: CHECK_SHAKE_GROUPS_V2.fb });
  runAuthoredFbBindScenario();
  reportCheckPass(CHECK_TAG, PASS_MESSAGE);
}

main();
