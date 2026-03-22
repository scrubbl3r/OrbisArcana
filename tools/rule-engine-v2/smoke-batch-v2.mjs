// Deterministic validation/build smoke matrix covering key interactions-v2 invariants.
import {
  INTERACTIONS_V2,
  validateInteractionsV2,
  buildRuleEngineFromInteractionsV2,
} from "../../src/content/interactions-v2/index.js";
import { cloneJsonV2 } from "./json-clone-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
// Cases are additive and deterministic to simplify triage when one fails.
const CHECK_TAG = "smoke:batch:v2";
const FAIL_TAG = CHECK_TAG;
const fail = (message) => failCheck(FAIL_TAG, message);

function logSmokePass(text) {
  const safeText = typeof text === "string" ? text : "";
  console.log(`[${CHECK_TAG}] PASS ${safeText}`);
}

function ruleById(cfg, ruleId) {
  const list = Array.isArray(cfg.rules) ? cfg.rules : [];
  const targetRuleId = typeof ruleId === "string" ? ruleId.trim() : "";
  const r = list.find((item) => (typeof item?.id === "string" ? item.id.trim() : "") === targetRuleId);
  if (!r || typeof r !== "object") fail(`missing rule in INTERACTIONS_V2: ${ruleId}`);
  return r;
}

function findFirstAction(rule, type) {
  return (Array.isArray(rule.then) ? rule.then : []).find(
    (a) => (typeof a?.type === "string" ? a.type.toLowerCase() : "") === type
  );
}

function expectValidationFail(caseName, cfg, expectedSubstring) {
  const res = validateInteractionsV2(cfg);
  if (res.ok) fail(`${caseName}: expected validation failure`);
  const text = (Array.isArray(res.errors) ? res.errors : []).join(" | ");
  if (!text.includes(expectedSubstring)) {
    fail(`${caseName}: expected error containing "${expectedSubstring}", got "${text}"`);
  }
  logSmokePass(caseName);
}

function expectValidationPass(caseName, cfg) {
  const res = validateInteractionsV2(cfg);
  const errors = Array.isArray(res.errors) ? res.errors : [];
  if (!res.ok) fail(`${caseName}: expected validation pass, got ${errors.join(" | ")}`);
  logSmokePass(caseName);
}

function expectBuildPass(caseName, cfg, assertFn = null) {
  let projected = null;
  try {
    projected = buildRuleEngineFromInteractionsV2({ interactionsV2: cfg, baseRuleEngine: { rules: [] } });
  } catch (err) {
    const msg = err instanceof Error && typeof err.message === "string" && err.message
      ? err.message
      : "unknown error";
    fail(`${caseName}: expected build pass, got ${msg}`);
  }
  if (typeof assertFn === "function") assertFn(projected);
  logSmokePass(caseName);
}

function ensureObject(value) {
  return (!!value && typeof value === "object" && !Array.isArray(value)) ? value : {};
}

function run() {
  {
    const cfg = cloneJsonV2(INTERACTIONS_V2);
    expectValidationPass("baseline.validate", cfg);
    expectBuildPass("baseline.build", cfg);
  }

  {
    const cfg = cloneJsonV2(INTERACTIONS_V2);
    cfg.debug = true;
    expectValidationFail("top_level.unsupported_key", cfg, "INTERACTIONS_V2 contains unsupported key: debug");
  }

  {
    const cfg = cloneJsonV2(INTERACTIONS_V2);
    const rule = ruleById(cfg, "r_rota_yspin_charged");
    rule.on.all[0] = { type: "spell", id: "gesture.spin_y" };
    expectValidationFail("condition.prefix_mismatch", cfg, "condition type/id prefix mismatch");
  }

  {
    const cfg = cloneJsonV2(INTERACTIONS_V2);
    const rule = ruleById(cfg, "r_rota_yspin_charged");
    const wakeWin = findFirstAction(rule, "wake_win");
    if (
      !wakeWin ||
      !Array.isArray(wakeWin.words) ||
      !wakeWin.words.length ||
      !Array.isArray(wakeWin.spells) ||
      !wakeWin.spells.length
    ) fail("wake_win action missing");
    wakeWin.words[0] = "gesture.spin_y";
    wakeWin.spells[0] = "gesture.spin_y";
    expectValidationFail("wake_win.word_prefix_mismatch", cfg, "wake_win word prefix mismatch");
  }

  {
    const cfg = cloneJsonV2(INTERACTIONS_V2);
    const rule = ruleById(cfg, "r_rota_yspin_charged");
    const evt = findFirstAction(rule, "event");
    if (!evt) fail("event action missing");
    evt.id = "spell.rota";
    expectValidationFail("event.id_prefix_mismatch", cfg, "event id prefix mismatch");
  }

  {
    const cfg = cloneJsonV2(INTERACTIONS_V2);
    const rule = ruleById(cfg, "r_rota_yspin_charged");
    rule.on.all[0] = { type: "spell", id: "spell." };
    expectValidationFail("condition.incomplete_qualified_id", cfg, "incomplete on.all id");
  }

  {
    const cfg = cloneJsonV2(INTERACTIONS_V2);
    cfg.defaults = ensureObject(cfg.defaults);
    cfg.defaults.event = { "spell.grace": { ms: 500 } };
    expectValidationFail("defaults.event.prefix_mismatch", cfg, "defaults.event key prefix mismatch");
  }

  {
    const cfg = cloneJsonV2(INTERACTIONS_V2);
    cfg.defaults = ensureObject(cfg.defaults);
    cfg.defaults.event = { "event.": { ms: 500 } };
    expectValidationFail("defaults.event.incomplete", cfg, "defaults.event key is incomplete");
  }

  {
    const cfg = cloneJsonV2(INTERACTIONS_V2);
    const rule = ruleById(cfg, "r_rota_yspin_charged");
    rule.on.all = [
      { type: "spell", id: "spell.rota" },
      { type: "gesture", id: "gesture.spin_y" },
      { type: "orb_state", id: "orb_state.charged" },
    ];
    const wakeWin = findFirstAction(rule, "wake_win");
    if (!wakeWin) fail("wake_win action missing");
    wakeWin.spells = ["spell.rota", "spell.sanctum", "spell.vectus"];
    const graceEvent = (Array.isArray(rule.then) ? rule.then : []).find((a) =>
      (typeof a?.type === "string" ? a.type.toLowerCase() : "") === "event"
        && (typeof a?.id === "string" ? a.id.toLowerCase() : "").includes("grace")
    );
    if (!graceEvent) fail("grace event action missing");
    graceEvent.id = "grace";
    delete graceEvent.ms;
    delete graceEvent.overrides;
    cfg.defaults = ensureObject(cfg.defaults);
    cfg.defaults.event = { "event.grace": { ms: 500 } };
    expectValidationPass("qualified_forms.validate", cfg);
    expectBuildPass("qualified_forms.build_normalization", cfg, (projected) => {
      const projectedRule = Array.isArray(projected.rules)
        ? projected.rules.find((r) => (typeof r?.id === "string" ? r.id : "") === "r_rota_yspin_charged")
        : null;
      if (!projectedRule) fail("qualified_forms: projected rota rule missing");
      const projectedGrace = (Array.isArray(projectedRule.then) ? projectedRule.then : []).find((a) =>
        a?.type === "event" && a?.id === "grace"
      );
      if (!projectedGrace) fail("qualified_forms: projected grace event missing");
      const projectedGraceMs = Number(projectedGrace.ms);
      if (projectedGraceMs !== 500) {
        fail(`qualified_forms: expected projected grace ms=500, got ${JSON.stringify(projectedGrace)}`);
      }
    });
  }

  logSmokePass("all cases");
}

run();
