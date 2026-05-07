export function createStageUiOverlayAdapter({
  refs = {},
} = {}) {
  return Object.freeze({
    openDeathOverlay() {
      if (!refs.deathPanel) return;
      refs.deathPanel.classList.remove("off");
      refs.deathPanel.setAttribute("aria-hidden", "false");
    },
    closeDeathOverlay() {
      if (!refs.deathPanel) return;
      refs.deathPanel.classList.add("off");
      refs.deathPanel.setAttribute("aria-hidden", "true");
    },
  });
}
