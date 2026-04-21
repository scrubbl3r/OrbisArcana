export function setDevStagingStatus(refs, html, cls = "devStagingDim") {
  if (!refs || !refs.status) return;
  const nextClass = String(cls || "");
  const nextHtml = String(html || "");
  if (refs.status.className !== nextClass) {
    refs.status.className = nextClass;
  }
  if (refs.status.innerHTML !== nextHtml) {
    refs.status.innerHTML = nextHtml;
  }
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
