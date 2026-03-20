import { validateSpellbookV2 } from "./validate-spellbook-v2.js";
import { WORDBOOK_V2 } from "./wordbook-v2.js";

export function validateWordbookV2(input = WORDBOOK_V2) {
  return validateSpellbookV2(input);
}

export { validateSpellbookV2 };
