import {
  INTERACTIONS_V2,
  validateInteractionsV2,
  buildRuleEngineFromInteractionsV2,
} from "../../src/content/interactions-v2/index.js";
import { jsonClone } from "./json-clone-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";

const CHECK_TAG = "smoke:batch:v2";
const FAIL_TAG = CHECK_TAG;
const fail = (message) => failCheck(FAIL_TAG, message);

function logSmokePass(text) {
  console.log(`[${CHECK_TAG}] PASS ${String(text || "")}`);
}

function ruleById(cfg, ruleId) {
  const list = Array.isArray(cfg.rules) ? cfg.rules : [];
  const r = list.find((item) => item && String(item.id || "").trim() === String(ruleId || "").trim());
  if (!r || typeof r !== "object") fail(`missing rule in INTERACTIONS_V2: ${ruleId}`);
  return r;
}

function findFirstAction(rule, type) {
  return (Array.isArray(rule.then) ? rule.then : []).find((a) => a && String(a.type || "").toLowerCase() === type);
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
  if (!res.ok) fail(`${caseName}: expected validation pass, got ${(res.errors || []).join(" | ")}`);
  logSmokePass(caseName);
}

function expectBuildPass(caseName, cfg, assertFn = null) {
  let projected = null;
  try {
    projected = buildRuleEngineFromInteractionsV2({ interactionsV2: cfg, baseRuleEngine: { rules: [] } });
  } catch (err) {
    fail(`${caseName}: expected build pass, got ${err && err.message ? err.message : String(err)}`);
  }
  if (typeof assertFn === "function") assertFn(projected);
  logSmokePass(caseName);
}

function run() {
  {
    const cfg = jsonClone(INTERACTIONS_V2);
    expectValidationPass("baseline.validate", cfg);
    expectBuildPass("baseline.build", cfg);
  }

  {
    const cfg = jsonClone(INTERACTIONS_V2);
    cfg.debug = true;
    expectValidationFail("top_level.unsupported_key", cfg, "INTERACTIONS_V2 contains unsupported key: debug");
  }

  {
    const cfg = jsonClone(INTERACTIONS_V2);
    const rule = ruleById(cfg, "r_rota_yspin_charged");
    rule.on.all[0] = { type: "spell", id: "gesture.y_spin" };
    expectValidationFail("condition.prefix_mismatch", cfg, "condition type/id prefix mismatch");
  }

  {
    const cfg = jsonClone(INTERACTIONS_V2);
    const rule = ruleById(cfg, "r_rota_yspin_charged");
    const wakeWin = findFirstAction(rule, "wake_win");
    if (!wakeWin || !Array.isArray(wakeWin.spells) || !wakeWin.spells.length) fail("wake_win action missing");
    wakeWin.spells[0] = "gesture.y_spin";
    expectValidationFail("wake_win.spell_prefix_mismatch", cfg, "wake_win spell prefix mismatch");
  }

  {
    const cfg = jsonClone(INTERACTIONS_V2);
    const rule = ruleById(cfg, "r_rota_yspin_charged");
    const evt = findFirstAction(rule, "event");
    if (!evt) fail("event action missing");
    evt.id = "spell.rota";
    expectValidationFail("event.id_prefix_mismatch", cfg, "event id prefix mismatch");
  }

  {
    const cfg = jsonClone(INTERACTIONS_V2);
    const rule = ruleById(cfg, "r_rota_yspin_charged");
    rule.on.all[0] = { type: "spell", id: "spell." };
    expectValidationFail("condition.incomplete_qualified_id", cfg, "incomplete on.all id");
  }

  {
    const cfg = jsonClone(INTERACTIONS_V2);
    cfg.defaults = cfg.defaults || {};
    cfg.defaults.event = { "spell.grace": { ms: 500 } };
    expectValidationFail("defaults.event.prefix_mismatch", cfg, "defaults.event key prefix mismatch");
  }

  {
    const cfg = jsonClone(INTERACTIONS_V2);
    cfg.defaults = cfg.defaults || {};
    cfg.defaults.event = { "event.": { ms: 500 } };
    expectValidationFail("defaults.event.incomplete", cfg, "defaults.event key is incomplete");
  }

  {
    const cfg = jsonClone(INTERACTIONS_V2);
    const rule = ruleById(cfg, "r_rota_yspin_charged");
    rule.on.all = [
      { type: "spell", id: "spell.rota" },
      { type: "gesture", id: "gesture.y_spin" },
      { type: "orb_state", id: "orb_state.charged" },
    ];
    const wakeWin = findFirstAction(rule, "wake_win");
    if (!wakeWin) fail("wake_win action missing");
    wakeWin.spells = ["spell.rota", "spell.sanctum", "spell.vectus"];
    const graceEvent = (Array.isArray(rule.then) ? rule.then : []).find((a) =>
      a && String(a.type || "").toLowerCase() === "event" && String(a.id || "").toLowerCase().includes("grace")
    );
    if (!graceEvent) fail("grace event action missing");
    graceEvent.id = "grace";
    delete graceEvent.ms;
    delete graceEvent.overrides;
    cfg.defaults = cfg.defaults || {};
    cfg.defaults.event = { "event.grace": { ms: 500 } };
    expectValidationPass("qualified_forms.validate", cfg);
    expectBuildPass("qualified_forms.build_normalization", cfg, (projected) => {
      const projectedRule = Array.isArray(projected.rules)
        ? projected.rules.find((r) => r && String(r.id || "") === "r_rota_yspin_charged")
        : null;
      if (!projectedRule) fail("qualified_forms: projected rota rule missing");
      const projectedGrace = (Array.isArray(projectedRule.then) ? projectedRule.then : []).find((a) =>
        a && a.type === "event" && a.id === "grace"
      );
      if (!projectedGrace) fail("qualified_forms: projected grace event missing");
      if (Number(projectedGrace.ms) !== 500) {
        fail(`qualified_forms: expected projected grace ms=500, got ${JSON.stringify(projectedGrace)}`);
      }
    });
  }

  logSmokePass("all cases");
}

run();
