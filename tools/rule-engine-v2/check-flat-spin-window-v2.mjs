import { EVT_SPELL_WINDOW_FLAT_SPIN_OPENED } from "../../src/contracts/events.js";

export function emitFlatSpinWindowOpened(eventBus, { axis = "y", atMs } = {}) {
  eventBus.emit(EVT_SPELL_WINDOW_FLAT_SPIN_OPENED, { axis, atMs });
}
