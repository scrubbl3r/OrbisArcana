import { DREAM_CONFIG_V2 } from "./dream-config-v2.js";
import { compileDreamConfigV2ToOrchestratorV2 } from "./compile-dream-config-v2.js";
import { validateDreamConfigV2 } from "./validate-dream-config-v2.js";

const DREAM_CONFIG_V2_ERROR_PREFIX = "DREAM_CONFIG_V2 validation failed: ";
const ERROR_DELIMITER = " | ";

export const ORCHESTRATOR_V2_BOOTSTRAP = Object.freeze({
  useInReceiverBootstrap: true,
});

const dreamValidation = validateDreamConfigV2(DREAM_CONFIG_V2);
if (!dreamValidation.ok) {
  throw new Error(`${DREAM_CONFIG_V2_ERROR_PREFIX}${dreamValidation.errors.join(ERROR_DELIMITER)}`);
}

export const ORCHESTRATOR_V2 = compileDreamConfigV2ToOrchestratorV2(DREAM_CONFIG_V2);
