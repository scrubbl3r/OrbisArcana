export function initLabAuthoringTabs({
  root = globalThis.document,
  defaultTabId = "",
  tabSelector = "[data-authoring-tab]",
  panelSelector = "[data-authoring-panel]",
  activeClass = "active",
} = {}) {
  if (!root || typeof root.querySelectorAll !== "function") return null;
  const tabs = Array.from(root.querySelectorAll(tabSelector));
  const panels = Array.from(root.querySelectorAll(panelSelector));
  if (!tabs.length || !panels.length) return null;
  const firstTabId = tabs[0].getAttribute("data-authoring-tab") || "";
  const initialTabId = defaultTabId || firstTabId;
  const setActive = (tabId = initialTabId) => {
    tabs.forEach((tab) => {
      const active = tab.getAttribute("data-authoring-tab") === tabId;
      tab.classList.toggle(activeClass, active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });
    panels.forEach((panel) => {
      panel.hidden = panel.getAttribute("data-authoring-panel") !== tabId;
    });
  };
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => setActive(tab.getAttribute("data-authoring-tab") || initialTabId));
  });
  setActive(initialTabId);
  return Object.freeze({ setActive });
}

export function initLabCollapsibleControlGroups({
  root = globalThis.document,
  toggleSelector = "[data-control-toggle]",
} = {}) {
  if (!root || typeof root.querySelectorAll !== "function") return null;
  const ownerDocument = root.ownerDocument || globalThis.document;
  const findBody = (toggle) => {
    const controlsId = toggle ? toggle.getAttribute("aria-controls") : "";
    if (!controlsId) return null;
    if (typeof root.getElementById === "function") return root.getElementById(controlsId);
    return ownerDocument && typeof ownerDocument.getElementById === "function"
      ? ownerDocument.getElementById(controlsId)
      : null;
  };
  const syncToggle = (toggle) => {
    const body = findBody(toggle);
    const expanded = toggle.getAttribute("aria-expanded") !== "false";
    if (body) body.hidden = !expanded;
  };
  root.querySelectorAll(toggleSelector).forEach(syncToggle);
  root.addEventListener("click", (event) => {
    const toggle = event.target && event.target.closest ? event.target.closest(toggleSelector) : null;
    if (!toggle || !root.contains(toggle)) return;
    const body = findBody(toggle);
    const expanded = toggle.getAttribute("aria-expanded") !== "false";
    toggle.setAttribute("aria-expanded", expanded ? "false" : "true");
    if (body) body.hidden = expanded;
  });
  return Object.freeze({ sync: () => root.querySelectorAll(toggleSelector).forEach(syncToggle) });
}
