/**
 * Thin adapter shell for the existing STT pipeline.
 *
 * This intentionally does not replace current STT logic yet. It provides a
 * provider-compatible interface so we can introduce a provider manager and keep
 * the downstream spell event contract stable while KWS is added in parallel.
 *
 * Hook your existing STT start/stop/mode logic into this adapter progressively.
 *
 * @param {{
 *   start?: Function,
 *   stop?: Function,
 *   setMode?: Function,
 *   getStatus?: Function,
 *   onEnabledChange?: Function,
 * }} [opts]
 */
export function createSttProvider(opts = {}) {
  let enabled = false;
  let started = false;

  function start() {
    started = true;
    if (typeof opts.start === "function") opts.start();
  }

  function stop() {
    started = false;
    if (typeof opts.stop === "function") opts.stop();
  }

  function destroy() {
    stop();
  }

  function setEnabled(next) {
    enabled = !!next;
    if (typeof opts.onEnabledChange === "function") {
      opts.onEnabledChange(enabled);
    }
  }

  function setMode(mode) {
    if (typeof opts.setMode === "function") opts.setMode(mode);
  }

  function getStatus() {
    return {
      id: "stt",
      enabled,
      started,
      delegate: typeof opts.getStatus === "function" ? opts.getStatus() : null,
    };
  }

  return Object.freeze({
    id: "stt",
    start,
    stop,
    destroy,
    setEnabled,
    setMode,
    getStatus,
  });
}

