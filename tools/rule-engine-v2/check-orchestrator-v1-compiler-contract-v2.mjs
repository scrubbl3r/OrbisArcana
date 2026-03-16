import { buildRuleEngineFromOrchestratorV1 } from "../../src/content/interactions-v2/build-rule-engine-from-orchestrator-v1.js";
import { failCheck, failCheckWithDetails } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "orchestrator-v1-compiler:v2";

function asJson(v) {
  return JSON.stringify(v);
}

const sample = Object.freeze({
  version: "1",
  enabled: true,
  defaults: Object.freeze({
    open: Object.freeze({ ttlMs: 1750 }),
    trigger: Object.freeze({
      grace: Object.freeze({ ms: 625 }),
    }),
  }),
  rules: Object.freeze([
    Object.freeze({
      id: "o_contract_sample",
      on: Object.freeze({
        spell: "rota",
        gesture: "spin_y",
        orb_state: "charged",
      }),
      open: Object.freeze(["sanctum", "vectus"]),
      trigger: Object.freeze([
        Object.freeze({ event: "grace", args: Object.freeze({ ms: 700, mode: "boost" }) }),
        "aoe_electric",
      ]),
      enabled: true,
      priority: 42,
    }),
  ]),
});

let built;
try {
  built = buildRuleEngineFromOrchestratorV1({
    orchestratorV1: sample,
    baseRuleEngine: Object.freeze({ version: "2", signals: [], windows: [], events: [], rules: [], eventRuntimeBindings: {} }),
  });
} catch (err) {
  failCheck(CHECK_TAG, `builder threw for valid sample: ${err instanceof Error ? err.message : String(err)}`);
}

if (!built || typeof built !== "object") {
  failCheck(CHECK_TAG, "builder returned non-object");
}
if (built.enabled !== true) {
  failCheck(CHECK_TAG, "builder did not preserve top-level enabled=true");
}
if (!Array.isArray(built.rules) || built.rules.length !== 1) {
  failCheck(CHECK_TAG, "builder did not produce exactly one compiled rule");
}

const [rule] = built.rules;
const details = [];
if (rule.id !== "o_contract_sample") details.push(`rule id mismatch: ${rule.id}`);
if (rule.enabled !== true) details.push("rule enabled mismatch");
if (rule.priority !== 42) details.push(`rule priority mismatch: ${rule.priority}`);

const expectedOn = [
  { type: "spell", id: "rota" },
  { type: "gesture", id: "spin_y" },
  { type: "orb_state", id: "charged" },
];
if (asJson(rule.on) !== asJson(expectedOn)) {
  details.push(`rule.on mismatch: got ${asJson(rule.on)} expected ${asJson(expectedOn)}`);
}

const expectedThen = [
  { type: "wake_win", spells: ["sanctum", "vectus"], ttlMs: 1750 },
  { type: "event", id: "grace", ms: 700, mode: "boost" },
  { type: "event", id: "aoe_electric" },
];
if (asJson(rule.then) !== asJson(expectedThen)) {
  details.push(`rule.then mismatch: got ${asJson(rule.then)} expected ${asJson(expectedThen)}`);
}

if (details.length) {
  failCheckWithDetails(CHECK_TAG, "compiled output contract mismatch", details);
}

reportCheckPass(CHECK_TAG, "orchestrator compiler contract holds for ON/OPEN/TRIGGER + defaults");
