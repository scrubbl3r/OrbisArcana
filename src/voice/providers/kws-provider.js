import { createKwsTokenParser } from "../kws/kws-token-parser.js";

/**
 * Mock/test KWS provider wrapper.
 *
 * This does not implement real audio keyword spotting yet. It provides a
 * provider-compatible surface and forwards token hits into the KWS token parser.
 * Useful for shadow-mode development and keyboard/dev-console simulation.
 *
 * @param {{
 *   eventBus?: { emit?: Function },
 *   parser?: ReturnType<typeof createKwsTokenParser>,
 *   shadow?: boolean,
 *   parserConfig?: object,
 * }} [opts]
 */
export function createKwsProvider(opts = {}) {
  const eventBus = opts.eventBus || null;
  const parser = opts.parser || createKwsTokenParser({
    eventBus,
    shadow: opts.shadow == null ? true : !!opts.shadow,
    ...(opts.parserConfig && typeof opts.parserConfig === "object" ? opts.parserConfig : {}),
  });

  let enabled = false;
  let started = false;
  let mode = "shadow";

  function start() {
    started = true;
  }

  function stop() {
    started = false;
  }

  function destroy() {
    started = false;
    enabled = false;
    parser.reset();
  }

  function setEnabled(next) {
    enabled = !!next;
    parser.setEnabled(enabled);
  }

  function setMode(nextMode) {
    mode = String(nextMode || "shadow");
    parser.setMode(mode === "kws" || mode === "active" ? "active" : "shadow");
  }

  /**
   * Dev/test helper: inject a token hit without real audio KWS.
   * @param {{token:string, confidence?:number, atMs?:number}} hit
   */
  function ingestTokenHit(hit) {
    if (!enabled || !started) return { matched: false, reason: "provider_inactive" };
    return parser.ingestToken({
      ...hit,
      providerId: "kws",
    });
  }

  function getStatus() {
    return {
      id: "kws",
      enabled,
      started,
      mode,
      parser: parser.getStatus(),
    };
  }

  return Object.freeze({
    id: "kws",
    start,
    stop,
    destroy,
    setEnabled,
    setMode,
    getStatus,
    ingestTokenHit,
    parser,
  });
}

