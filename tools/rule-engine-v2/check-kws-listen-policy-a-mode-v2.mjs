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

async function main() {
  const eventBus = createEventBus();
  const backendConfigs = [];
  const parserConfigs = [];
  const controller = createKwsListenPolicyController({
    eventBus,
    initialMode: "B",
    nowMs: () => Date.now(),
    kwsRuntimeController: {
      setKwsBackendConfig(next = {}) {
        backendConfigs.push({
          activeTokens: Array.isArray(next.activeTokens) ? next.activeTokens.slice().sort() : null,
        });
      },
      setKwsWordParserConfig(next = {}) {
        parserConfigs.push({
          words: Array.isArray(next.words) ? next.words.map((word) => String(word?.id || "")).filter(Boolean).sort() : null,
          wakeTokens: Array.isArray(next.wakeTokens) ? next.wakeTokens.slice().sort() : null,
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
  assertHasAll(parserConfigs.at(-1)?.words || [], ["orbis", "are_kay_nah"], "A idle parser words");
  assertHasAll(parserConfigs.at(-1)?.wakeTokens || [], ["orbis", "are kay nah"], "A idle parser wakeTokens");

  eventBus.emit("rule_engine.wake_win_opened", {
    windowId: "wake.main",
    words: ["domus", "electrum", "pyro"],
    ttlMs: 10,
    atMs: Date.now(),
  });
  status = controller.getStatus();
  assertHasAll(status.listenableWordIds, ["orbis", "are_kay_nah", "domus", "electrum", "pyro"], "A opened listenableWordIds");
  assertHasAll(backendConfigs.at(-1)?.activeTokens || [], ["orbis", "are kay nah", "domus", "electrum", "pyro"], "A opened backend tokens");
  assertHasAll(parserConfigs.at(-1)?.words || [], ["orbis", "are_kay_nah", "domus", "electrum", "pyro"], "A opened parser words");

  await new Promise((resolve) => setTimeout(resolve, 40));
  status = controller.getStatus();
  assertHasAll(status.listenableWordIds, ["orbis", "are_kay_nah"], "A expired listenableWordIds");
  assertCheck(!status.listenableWordIds.includes("pyro"), `[${CHECK_TAG}] expected pyro to expire from strict listen set`);
  assertHasAll(backendConfigs.at(-1)?.activeTokens || [], ["orbis", "are kay nah"], "A expired backend tokens");
  assertCheck(!(backendConfigs.at(-1)?.activeTokens || []).includes("pyro"), `[${CHECK_TAG}] expected pyro token to expire from backend`);
  assertHasAll(parserConfigs.at(-1)?.words || [], ["orbis", "are_kay_nah"], "A expired parser words");
  assertCheck(!(parserConfigs.at(-1)?.words || []).includes("pyro"), `[${CHECK_TAG}] expected pyro to expire from parser words`);

  controller.stop();
  reportCheckPass(CHECK_TAG, PASS_MESSAGE);
}

await main();
