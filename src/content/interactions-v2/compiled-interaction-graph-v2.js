import { INTERACTION_GRAPH_V2 } from "./interaction-graph-v2.js?v=20260516a";
import { compileInteractionGraphV2ToCompiledInteractionGraphV2 } from "./compile-interaction-graph-v2.js?v=20260516a";
import { validateInteractionGraphV2 } from "./validate-interaction-graph-v2.js?v=20260516a";

const INTERACTION_GRAPH_V2_ERROR_PREFIX = "INTERACTION_GRAPH_V2 validation failed: ";
const ERROR_DELIMITER = " | ";

export const COMPILED_INTERACTION_GRAPH_V2_BOOTSTRAP = Object.freeze({
  useInReceiverBootstrap: true,
});

const interactionGraphValidation = validateInteractionGraphV2(INTERACTION_GRAPH_V2);
if (!interactionGraphValidation.ok) {
  throw new Error(`${INTERACTION_GRAPH_V2_ERROR_PREFIX}${interactionGraphValidation.errors.join(ERROR_DELIMITER)}`);
}

export const COMPILED_INTERACTION_GRAPH_V2 = compileInteractionGraphV2ToCompiledInteractionGraphV2(INTERACTION_GRAPH_V2);
