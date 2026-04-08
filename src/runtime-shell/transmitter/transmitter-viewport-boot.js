export function createTransmitterViewportBoot({ rootWindow = window, rootDocument = document } = {}) {
  const root = rootDocument.documentElement;

  function applyVhUnit() {
    const vv = rootWindow.visualViewport;
    const height = vv && vv.height ? vv.height : rootWindow.innerHeight;
    root.style.setProperty("--vh", `${height * 0.01}px`);
  }

  function attach() {
    applyVhUnit();
    rootWindow.addEventListener("resize", applyVhUnit, { passive: true });
    rootWindow.addEventListener("orientationchange", applyVhUnit, { passive: true });
    if (rootWindow.visualViewport) {
      rootWindow.visualViewport.addEventListener("resize", applyVhUnit, { passive: true });
      rootWindow.visualViewport.addEventListener("scroll", applyVhUnit, { passive: true });
    }
  }

  return {
    applyVhUnit,
    attach,
  };
}
