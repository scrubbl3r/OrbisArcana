export function createKwsRuntimeConfig() {
  const tokenList = ["orbis", "domus", "tempus", "fridgis", "electrum", "rota", "sanctum", "vectus"];
  return {
    defaultVoiceEngine: "kws",
    defaultBackendKey: "openwakeword_browser",
    autostartRetryMs: 2000,
    autostartMaxMs: 120000,
    autostartRekickMs: 5000,
    startStallMs: 8000,
    gateTimeoutMs: 1500,
    readoutTickMs: 250,
    rowTop: ["orbis", "domus", "tempus", "fridgis", "electrum"],
    rowBottom: ["rota", "sanctum", "vectus"],
    classTokens: ["rota", "sanctum", "vectus"],
    logTokens: tokenList.slice(),
    tempUngatedTokens: tokenList.slice(),
    tokenCanonicalMap: Object.freeze({}),
  };
}
