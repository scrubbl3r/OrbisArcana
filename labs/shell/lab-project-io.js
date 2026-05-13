export function downloadTextFile(filename, text, mimeType = "application/json;charset=utf-8") {
  const blob = new Blob([String(text || "")], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function refreshProjectConnectUi({
  connectProjectBtn,
  projectRootDirHandle,
  connectedTitle = "Connected. Publish writes to project files.",
  disconnectedTitle = "Connect repo root for one-click publish.",
} = {}) {
  if (!connectProjectBtn) return;
  const connected = !!projectRootDirHandle;
  connectProjectBtn.textContent = connected ? "Project Connected" : "Connect Project";
  connectProjectBtn.title = connected ? connectedTitle : disconnectedTitle;
}

export async function connectProjectFolder({
  showDirectoryPicker,
  onConnected,
  refreshProjectConnectUi,
} = {}) {
  if (!showDirectoryPicker) {
    window.alert("This browser does not support project-folder connect. Publish will fall back to file save/download.");
    return false;
  }
  try {
    const dirHandle = await showDirectoryPicker({ mode: "readwrite" });
    if (!dirHandle) return false;
    if (typeof onConnected === "function") onConnected(dirHandle);
    if (typeof refreshProjectConnectUi === "function") refreshProjectConnectUi();
    return true;
  } catch (err) {
    if (err && err.name === "AbortError") return false;
    console.error(err);
    window.alert("Could not connect the project folder.");
    return false;
  }
}

export async function getOrCreateSubdir(parentHandle, name) {
  return parentHandle.getDirectoryHandle(String(name || ""), { create: true });
}

export async function saveTextToConnectedProjectPath({ projectRootDirHandle, pathParts, text }) {
  if (!projectRootDirHandle || !Array.isArray(pathParts) || !pathParts.length) return false;
  let dir = projectRootDirHandle;
  for (let i = 0; i < pathParts.length - 1; i += 1) {
    dir = await getOrCreateSubdir(dir, pathParts[i]);
  }
  const fileName = String(pathParts[pathParts.length - 1] || "");
  if (!fileName) return false;
  const fileHandle = await dir.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(String(text || ""));
  await writable.close();
  return true;
}

export async function saveTextToConnectedProjectDrafts({
  projectRootDirHandle,
  draftPathParts,
  filename,
  text,
} = {}) {
  return saveTextToConnectedProjectPath({
    projectRootDirHandle,
    pathParts: [...(Array.isArray(draftPathParts) ? draftPathParts : []), filename],
    text,
  });
}

export async function saveTextToProjectFile(filename, text, {
  description = "JSON draft",
  accept = Object.freeze({ "application/json": [".json"] }),
} = {}) {
  if (!window.showSaveFilePicker) return false;
  const handle = await window.showSaveFilePicker({
    suggestedName: filename,
    types: [{ description, accept }],
  });
  const writable = await handle.createWritable();
  await writable.write(String(text || ""));
  await writable.close();
  return true;
}
