export function createLabProfileStore() {
  return {
    profilesByValue: Object.create(null),
    activeValue: "",
  };
}

function defaultStorage() {
  return typeof globalThis !== "undefined" && globalThis.localStorage
    ? globalThis.localStorage
    : null;
}

export function readStoredLabProfiles(storageKey, {
  storage = defaultStorage(),
} = {}) {
  if (!storage || typeof storage.getItem !== "function") return null;
  try {
    const parsed = JSON.parse(storage.getItem(storageKey) || "null");
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (_err) {
    return null;
  }
}

export function loadLabProfileStore(storageKey, profileStore, {
  storage = defaultStorage(),
  normalizeProfile = null,
} = {}) {
  const parsed = readStoredLabProfiles(storageKey, { storage });
  const profiles = parsed && parsed.profilesByValue && typeof parsed.profilesByValue === "object"
    ? parsed.profilesByValue
    : {};
  profileStore.profilesByValue = profileStore.profilesByValue || Object.create(null);
  for (const [value, profile] of Object.entries(profiles)) {
    if (!profile || typeof profile !== "object") continue;
    const nextProfile = typeof normalizeProfile === "function"
      ? normalizeProfile({ value, profile })
      : { ...profile, value: String(profile.value || value) };
    if (!nextProfile || typeof nextProfile !== "object") continue;
    const nextValue = String(nextProfile.storeValue || nextProfile.value || value);
    if (!nextValue) continue;
    const { storeValue: _storeValue, ...profileRecord } = nextProfile;
    profileStore.profilesByValue[nextValue] = profileRecord;
  }
  profileStore.activeValue = parsed && typeof parsed.activeValue === "string" ? parsed.activeValue : "";
}

export function persistLabProfileStore(storageKey, profileStore, {
  storage = defaultStorage(),
} = {}) {
  if (!storage || typeof storage.setItem !== "function") return;
  try {
    storage.setItem(storageKey, JSON.stringify({
      profilesByValue: profileStore && profileStore.profilesByValue ? profileStore.profilesByValue : {},
      activeValue: String(profileStore && profileStore.activeValue || ""),
    }));
  } catch (_err) {
    // Ignore localStorage write failures.
  }
}
