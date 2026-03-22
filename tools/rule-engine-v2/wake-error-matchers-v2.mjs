// Shared matcher helpers for wake-related runtime/validator error checks.
import { wakeUnknownWordErrorTokenV2 } from "./wake-test-ids-v2.mjs";
const WAKE_WINDOW_IDS_MISSING_PREFIX_V2 = "WAKE_WINDOW_WORD_IDS missing interactions-v2 wake_win word ids: ";

// String-contains matching keeps compatibility with prefixed diagnostic lines.
function hasErrorTokenV2(errors = [], token = "") {
  return (Array.isArray(errors) ? errors : []).some((error) => String(error).includes(token));
}

export function hasWakeUnknownWordErrorV2(errors = [], wordId) {
  const token = wakeUnknownWordErrorTokenV2(wordId);
  return hasErrorTokenV2(errors, token);
}

export function hasWakeWindowIdsMissingErrorV2(errors = [], wordId) {
  const token = `${WAKE_WINDOW_IDS_MISSING_PREFIX_V2}${wordId}`;
  return hasErrorTokenV2(errors, token);
}
