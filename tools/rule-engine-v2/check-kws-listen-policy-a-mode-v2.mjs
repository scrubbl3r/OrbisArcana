import { createEventBus } from "../../src/events/event-bus.js";
import {
  createKwsListenPolicyController,
  deriveStrictKwsListenPolicySnapshot,
} from "../../src/voice/kws/kws-listen-policy-controller.js";
import { assertCheck } from "./check-assert-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "kws-listen-policy-a-mode:v2";
const PASS_MESSAGE = "strict A mode derives roots at idle and extends the backend listen set only through opened SSOT windows";

function assertHasAll(haystack, expected, label) {
  const set = new Set(Array.isArray(haystack) ? haystack : []);
  for (const item of expected) {
    assertCheck(set.has(item), `[${CHECK_TAG}] ${label} missing expected entry: ${item}`);
  }
}

function main() {
  const eventBus = createEventBus();
  const backendConfigs = [];
  let nowRef = 1000;
  const controller = createKwsListenPolicyController({
    eventBus,
    initialMode: "B",
    nowMs: () => nowRef,
    kwsRuntimeController: {
      setKwsBackendConfig(next = {}) {
        backendConfigs.push({
          activeTokens: Array.isArray(next.activeTokens) ? next.activeTokens.slice().sort() : null,
        });
      },
    },
  });

  const derived = deriveStrictKwsListenPolicySnapshot({
    nowMs: 1000,
    openWindows: [
      { id: "wake.main", wordIds: ["domus", "electrum"], expiresAtMs: 2000 },
      { id: "expired.window", wordIds: ["pyro"], expiresAtMs: 900 },
    ],
  });
  assertHasAll(derived.rootWordIds, ["orbis", "are_kay_nah"], "derived roots");
  assertHasAll(derived.listenableWordIds, ["orbis", "are_kay_nah", "domus", "electrum"], "derived listenableWordIds");
  assertCheck(!derived.listenableWordIds.includes("pyro"), `[${CHECK_TAG}] expired window word should not remain listenable`);

  controller.start();
  let status = controller.getStatus();
  assertCheck(status.mode === "B", `[${CHECK_TAG}] expected controller to default to B`);
  assertCheck(backendConfigs.at(-1)?.activeTokens === null, `[${CHECK_TAG}] expected B mode to leave backend ungated`);

  controller.setMode("A");
  status = controller.getStatus();
  assertCheck(status.mode === "A", `[${CHECK_TAG}] expected controller mode A after toggle`);
  assertHasAll(status.listenableWordIds, ["orbis", "are_kay_nah"], "A idle listenableWordIds");
  assertHasAll(backendConfigs.at(-1)?.activeTokens || [], ["orbis", "are kay nah"], "A idle backend tokens");

  eventBus.emit("rule_engine.wake_win_opened", {
    windowId: "wake.main",
    words: ["domus", "electrum", "pyro"],
    ttlMs: 1500,
    atMs: nowRef,
  });
  status = controller.getStatus();
  assertHasAll(status.listenableWordIds, ["orbis", "are_kay_nah", "domus", "electrum", "pyro"], "A opened listenableWordIds");
  assertHasAll(backendConfigs.at(-1)?.activeTokens || [], ["orbis", "are kay nah", "domus", "electrum", "pyro"], "A opened backend tokens");

  controller.stop();
  reportCheckPass(CHECK_TAG, PASS_MESSAGE);
}

main();
