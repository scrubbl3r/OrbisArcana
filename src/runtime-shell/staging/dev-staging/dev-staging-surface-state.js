export function setDevStagingFatal(refs, message = "") {
  if (!refs || !refs.fatal) return;
  refs.fatal.textContent = String(message || "");
  refs.fatal.classList.toggle("on", !!message);
}
