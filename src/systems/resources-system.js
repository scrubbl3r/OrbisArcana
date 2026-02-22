export function createResourcesSystem({
  eventBus,
  nowMs = () => Date.now(),
  config = {},
} = {}) {
  if (!eventBus || typeof eventBus.on !== "function" || typeof eventBus.emit !== "function") {
    throw new Error("createResourcesSystem requires eventBus.on/eventBus.emit");
  }

  const unsub = [];
  const state = {
    energyBankPts: 0,
    energyBankLastMs: 0,
    storedGlobes: 0,
  };

  const energyBankCap = Math.max(0, Number(config.energyBankCap) || 1000);
  const energyShakeCost = Math.max(0, Number(config.energyShakeCost) || 100);
  const energyChargeRatePps = Math.max(0, Number(config.energyChargeRatePps) || 160);

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, Number(v) || 0));
  }

  function emitEnergyChanged(atMs) {
    eventBus.emit("energy.bank_changed", {
      bankPts: state.energyBankPts,
      capPts: energyBankCap,
      atMs: Number(atMs) || nowMs(),
    });
  }

  function emitGlobeInventoryChanged(atMs) {
    eventBus.emit("energy.globe_inventory_changed", {
      stored: state.storedGlobes,
      atMs: Number(atMs) || nowMs(),
    });
  }

  function resetEnergyBank(atMs) {
    state.energyBankPts = 0;
    state.energyBankLastMs = 0;
    emitEnergyChanged(atMs);
  }

  function resetGlobes(atMs) {
    state.storedGlobes = 0;
    emitGlobeInventoryChanged(atMs);
  }

  function resetAll(atMs) {
    resetEnergyBank(atMs);
    resetGlobes(atMs);
  }

  function updateEnergyBankFromPhone(energyFromPhone01, atMs) {
    const now = Number(atMs) || nowMs();
    const e = Math.max(0, Number(energyFromPhone01) || 0);
    if (!state.energyBankLastMs) state.energyBankLastMs = now;
    let dt = (now - state.energyBankLastMs) / 1000;
    state.energyBankLastMs = now;
    dt = clamp(dt, 0, 0.25);
    state.energyBankPts = clamp(
      state.energyBankPts + (e * energyChargeRatePps * dt),
      0,
      energyBankCap
    );
    emitEnergyChanged(now);
    return state.energyBankPts;
  }

  function getEnergyBankPts() {
    return state.energyBankPts;
  }

  function getEnergyBankCap() {
    return energyBankCap;
  }

  function canSpendShake() {
    return state.energyBankPts >= energyShakeCost;
  }

  function spendShake(atMs) {
    const now = Number(atMs) || nowMs();
    state.energyBankPts = clamp(state.energyBankPts - energyShakeCost, 0, energyBankCap);
    emitEnergyChanged(now);
    eventBus.emit("energy.shake_spent", {
      costPts: energyShakeCost,
      bankPts: state.energyBankPts,
      capPts: energyBankCap,
      atMs: now,
    });
    return state.energyBankPts;
  }

  function getStoredGlobeCount() {
    return state.storedGlobes;
  }

  function snapshot() {
    return {
      energy: {
        bankPts: state.energyBankPts,
        capPts: energyBankCap,
        lastUpdatedAtMs: state.energyBankLastMs,
      },
      globes: {
        storedCount: state.storedGlobes,
      },
      config: {
        energyShakeCostPts: energyShakeCost,
        energyChargeRatePps,
      },
    };
  }

  function addStoredGlobe(payload = {}) {
    const atMs = Number(payload.atMs) || nowMs();
    state.storedGlobes += 1;
    emitGlobeInventoryChanged(atMs);
    return state.storedGlobes;
  }

  function consumeStoredGlobe(payload = {}) {
    if (state.storedGlobes <= 0) return { ok: false, stored: 0 };
    const atMs = Number(payload.atMs) || nowMs();
    state.storedGlobes = Math.max(0, state.storedGlobes - 1);
    eventBus.emit("energy.globe_spent", {
      reason: String(payload.reason || "unknown"),
      spellId: payload.spellId ? String(payload.spellId) : undefined,
      axis: payload.axis ? String(payload.axis) : undefined,
      slot: payload.slot ? String(payload.slot) : undefined,
      stored: state.storedGlobes,
      atMs,
    });
    emitGlobeInventoryChanged(atMs);
    return { ok: true, stored: state.storedGlobes };
  }

  function start() {
    unsub.push(eventBus.on("pickup.collected", (payload = {}) => {
      if (String(payload.type || "") !== "energy_globe") return;
      addStoredGlobe({ atMs: payload.atMs });
    }));
    unsub.push(eventBus.on("orb.died", () => {
      resetGlobes();
    }));
    unsub.push(eventBus.on("orb.revived", () => {
      resetGlobes();
    }));
  }

  function stop() {
    while (unsub.length) {
      const fn = unsub.pop();
      try { fn(); } catch (_) {}
    }
  }

  return {
    start,
    stop,
    resetEnergyBank,
    resetGlobes,
    resetAll,
    updateEnergyBankFromPhone,
    getEnergyBankPts,
    getEnergyBankCap,
    canSpendShake,
    spendShake,
    getStoredGlobeCount,
    consumeStoredGlobe,
    snapshot,
  };
}
