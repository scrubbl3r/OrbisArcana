export const LAB_WORKSPACES = Object.freeze([
  Object.freeze({
    id: "vfx-studio",
    label: "VFX Studio",
    href: "../vfx-studio/vfx-studio.html",
  }),
  Object.freeze({
    id: "world-workshop",
    label: "World Workshop",
    href: "../world-workshop/world-workshop.html",
  }),
  Object.freeze({
    id: "enemy-workshop",
    label: "Enemy Workshop",
    href: "../enemy-workshop/enemy-workshop.html",
  }),
]);

export function renderLabWorkspaceNav({
  root = document,
  currentWorkspaceId = "",
  workspaces = LAB_WORKSPACES,
  selector = "[data-lab-workspace-nav]",
} = {}) {
  const nav = root && typeof root.querySelector === "function" ? root.querySelector(selector) : null;
  if (!nav) return null;
  nav.classList.add("labWorkspaceNav");
  nav.setAttribute("aria-label", "Lab workspaces");
  nav.innerHTML = (Array.isArray(workspaces) ? workspaces : [])
    .map((workspace = {}) => {
      const id = String(workspace.id || "");
      const label = String(workspace.label || id);
      const href = String(workspace.href || "#");
      const current = id && id === String(currentWorkspaceId || "");
      return `<a class="labWorkspaceNavLink" href="${href}"${current ? ' aria-current="page"' : ""}>${label}</a>`;
    })
    .join("");
  return nav;
}
