export function selectedSelectOption(selectEl) {
  if (!selectEl) return null;
  const idx = selectEl.selectedIndex;
  return idx >= 0 ? selectEl.options[idx] : null;
}

export function listSelectOptions(selectEl) {
  return selectEl ? Array.from(selectEl.options) : [];
}

export function findSelectOptionByValue(selectEl, value) {
  return listSelectOptions(selectEl).find((option) => option.value === value) || null;
}

export function slugifyProfileName(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function nextCustomProfileValue(selectEl, baseKind, name, {
  namespace = "custom",
  fallbackBase = "profile",
  fallbackName = "custom",
} = {}) {
  const base = slugifyProfileName(baseKind) || fallbackBase;
  const slug = slugifyProfileName(name) || fallbackName;
  let i = 1;
  let value = `${namespace}:${base}:${slug}`;
  if (!selectEl) return value;
  const exists = () => listSelectOptions(selectEl).some((option) => option.value === value);
  while (exists()) {
    i += 1;
    value = `${namespace}:${base}:${slug}-${i}`;
  }
  return value;
}
