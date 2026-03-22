// Compatibility shim re-export; canonical implementation lives in json-clone-v2.mjs.
// Kept for stable import paths while migration converges on cloneJsonV2.
import { cloneJsonV2 } from "./json-clone-v2.mjs";
export { cloneJsonV2 };
