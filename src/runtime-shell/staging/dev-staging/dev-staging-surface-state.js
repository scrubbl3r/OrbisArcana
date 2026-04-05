export function setDevStagingStatus(refs, html, cls = "devStagingDim") {
  if (!refs || !refs.status) return;
  refs.status.className = cls;
  refs.status.innerHTML = String(html || "");
}

export function setDevStagingFatal(refs, message = "") {
  if (!refs || !refs.fatal) return;
  refs.fatal.textContent = String(message || "");
  refs.fatal.classList.toggle("on", !!message);
}

export function setDevStagingDebugNote(refs, text = "") {
  if (!refs || !refs.devSpinAuditNote) return;
  refs.devSpinAuditNote.textContent = String(text || "");
}
