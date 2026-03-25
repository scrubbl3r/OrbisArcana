import { EVT_SPELL_WINDOW_SPIN_OPENED } from "../../src/contracts/events.js";
import { CHECK_AXES_V2 } from "./check-gesture-constants-v2.mjs";

// Emits the flat-spin window-open event used by gesture window checks.
export function emitFlatSpinWindowOpened(eventBus, { axis = CHECK_AXES_V2.y, atMs } = {}) {
  eventBus.emit(EVT_SPELL_WINDOW_SPIN_OPENED, { axis, atMs });
}
