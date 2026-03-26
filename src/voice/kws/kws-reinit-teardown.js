export async function teardownKwsRuntimeForReinit({
  clearAutostartWatchdog,
  stopReadoutTick,
  clearWakeHudGateTimer,
  eventBindings,
  kwsListenPolicyController,
  setEventBindings,
  setKwsListenPolicyController,
  voiceProviderManager,
  kwsWordProvider,
  kwsVoiceProvider,
  setVoiceProviderManager,
  setKwsWordProvider,
  setKwsVoiceProvider,
} = {}) {
  if (typeof clearAutostartWatchdog === "function") clearAutostartWatchdog();
  if (typeof stopReadoutTick === "function") stopReadoutTick();
  if (typeof clearWakeHudGateTimer === "function") clearWakeHudGateTimer();

  if (eventBindings && typeof eventBindings.dispose === "function") {
    eventBindings.dispose();
  }
  if (typeof setEventBindings === "function") setEventBindings(null);
  if (kwsListenPolicyController && typeof kwsListenPolicyController.stop === "function") {
    try { kwsListenPolicyController.stop(); } catch (_) {}
  }
  if (typeof setKwsListenPolicyController === "function") setKwsListenPolicyController(null);

  const manager = voiceProviderManager || null;
  const provider = kwsWordProvider || kwsVoiceProvider || null;

  try {
    if (manager && typeof manager.stop === "function") await Promise.resolve(manager.stop());
  } catch (_) {}

  let destroyedByManager = false;
  try {
    if (manager && typeof manager.destroy === "function") {
      await Promise.resolve(manager.destroy());
      destroyedByManager = true;
    }
  } catch (_) {}

  if (!destroyedByManager && provider) {
    try {
      if (typeof provider.setEnabled === "function") provider.setEnabled(false);
    } catch (_) {}
    try {
      if (typeof provider.stop === "function") await Promise.resolve(provider.stop());
    } catch (_) {}
    try {
      if (typeof provider.destroy === "function") await Promise.resolve(provider.destroy());
    } catch (_) {}
  }

  if (typeof setVoiceProviderManager === "function") setVoiceProviderManager(null);
  if (typeof setKwsWordProvider === "function") setKwsWordProvider(null);
  if (typeof setKwsVoiceProvider === "function") setKwsVoiceProvider(null);
}
