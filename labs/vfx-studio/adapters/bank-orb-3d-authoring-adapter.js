export function createBankOrb3dAuthoringAdapter() {
  function apply(_els, _settings, { applyPreview = null } = {}) {
    if (typeof applyPreview === "function") applyPreview();
    return true;
  }

  return Object.freeze({
    defaultSettings: () => ({}),
    capture: () => ({}),
    apply,
  });
}
