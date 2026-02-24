import {
  PORCUPINE_LOCAL_ASSET_MANIFEST,
  getPorcupineInitStatus,
  initLocalPorcupineKwsBackend,
} from "./porcupine-init.js";
import { installOrbisCreatePorcupineSdkSessionGlobal } from "./porcupine-sdk-session-global.js";

let bootState = {
  attempted: false,
  loadedScript: false,
  loadedBridgeScript: false,
  hasBridge: false,
  hasHooks: false,
  hasFactory: false,
  simulated: false,
  installed: false,
  reason: "not_attempted",
};

function isPlaceholderManifest(manifest = PORCUPINE_LOCAL_ASSET_MANIFEST) {
  const sdk = manifest && manifest.sdk ? manifest.sdk : {};
  const version = String(sdk.version || "");
  return version.toUpperCase() === "UNSET"
    || version.endsWith("-local")
    || String(sdk.scriptPath || "").includes("/UNSET/");
}

function ensureScriptOnce(src) {
  if (typeof document === "undefined" || !src) return Promise.resolve(false);
  const existing = document.querySelector(`script[data-orbis-kws-sdk="true"][src="${src}"]`);
  if (existing) {
    if (existing.dataset.loaded === "true") return Promise.resolve(true);
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Failed to load KWS SDK script: ${src}`)), { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.dataset.orbisKwsSdk = "true";
    s.addEventListener("load", () => {
      s.dataset.loaded = "true";
      resolve(true);
    }, { once: true });
    s.addEventListener("error", () => reject(new Error(`Failed to load KWS SDK script: ${src}`)), { once: true });
    document.head.appendChild(s);
  });
}

function resolveCreateSdkSession(factoryName = "OrbisCreatePorcupineSdkSession") {
  if (typeof window === "undefined") return null;
  const fn = window[factoryName];
  return (typeof fn === "function") ? fn : null;
}

/**
 * Best-effort local Porcupine boot:
 * - attempts to load local SDK script (if manifest is configured)
 * - looks for a global session factory (default `window.OrbisCreatePorcupineSdkSession`)
 * - installs `window.OrbisKwsBackendFactory` via `initLocalPorcupineKwsBackend(...)`
 *
 * Safe fallback behavior:
 * - returns `installed:false` when local SDK assets are not present/configured
 * - does not break receiver/STT startup
 */
export async function bootLocalPorcupineKws(opts = {}) {
  if (bootState.installed) {
    return {
      installed: true,
      status: { ...bootState, init: getPorcupineInitStatus() },
    };
  }

  bootState = {
    attempted: true,
    loadedScript: false,
    loadedBridgeScript: false,
    hasBridge: false,
    hasHooks: false,
    hasFactory: false,
    simulated: false,
    installed: false,
    reason: "starting",
  };

  const manifest = opts.manifest || PORCUPINE_LOCAL_ASSET_MANIFEST;
  const factoryName = String(opts.globalFactoryName || "OrbisCreatePorcupineSdkSession");
  const allowSimulation = opts.allowSimulation == null ? true : !!opts.allowSimulation;

  async function installWithFactory(createSdkSession, reason = "installed") {
    const keywordEntries = Object.entries((manifest && manifest.keywords) || {}).map(([token, modelPath]) => ({
      token,
      label: token,
      modelPath,
    }));
    const res = await initLocalPorcupineKwsBackend({
      label: "porcupine-web-local",
      createSdkSession,
      keywords: keywordEntries,
    });
    bootState.installed = !!(res && res.installed);
    bootState.reason = bootState.installed ? reason : "init_failed";
    bootState.hasFactory = typeof resolveCreateSdkSession(factoryName) === "function";
    bootState.hasBridge = typeof window !== "undefined" && !!window.OrbisPorcupineSdkBridge;
    bootState.hasHooks = typeof window !== "undefined" && !!window.OrbisPorcupineSdkHooks;
    bootState.simulated = /simulated/.test(String(reason || ""));
    return {
      installed: bootState.installed,
      status: { ...bootState, init: (res && res.status) ? res.status : getPorcupineInitStatus() },
      error: res && res.error ? res.error : null,
    };
  }

  try {
    if (isPlaceholderManifest(manifest)) {
      if (allowSimulation) {
        const simFactory = installOrbisCreatePorcupineSdkSessionGlobal({
          simulate: true,
          simulationIntervalMs: Number(opts.simulationIntervalMs) || 1200,
        });
        return installWithFactory(simFactory, "installed_simulated");
      }
      bootState.reason = "manifest_unset";
      return {
        installed: false,
        status: { ...bootState, init: getPorcupineInitStatus() },
      };
    }

    const scriptPath = manifest && manifest.sdk ? manifest.sdk.scriptPath : "";
    const bridgeScriptPath = manifest && manifest.sdk ? manifest.sdk.bridgeScriptPath : "";
    if (scriptPath) {
      try {
        await ensureScriptOnce(scriptPath);
        bootState.loadedScript = true;
        if (
          bridgeScriptPath
          && typeof window !== "undefined"
          && (!window.OrbisPorcupineSdkBridge || typeof window.OrbisPorcupineSdkBridge !== "object")
        ) {
          try {
            await ensureScriptOnce(bridgeScriptPath);
            bootState.loadedBridgeScript = true;
          } catch (_ignoredBridgeLoadError) {
            // Bridge script is optional during early local integration stages.
          }
        }
        if (typeof window !== "undefined" && typeof window.OrbisPorcupineSdkHooks !== "function" && (!window.OrbisPorcupineSdkHooks || typeof window.OrbisPorcupineSdkHooks !== "object")) {
          try {
            const hooksLocalMod = await import("./porcupine-sdk-hooks-local.js");
            if (hooksLocalMod && typeof hooksLocalMod.installOrbisPorcupineSdkHooksLocal === "function") {
              hooksLocalMod.installOrbisPorcupineSdkHooksLocal();
            }
          } catch (_ignored) {}
        }
        if (typeof window !== "undefined" && typeof window.OrbisCreatePorcupineSdkSession !== "function") {
          try {
            const sessionGlobalMod = await import("./porcupine-sdk-session-global.js");
            if (sessionGlobalMod && typeof sessionGlobalMod.autoInstallOrbisPorcupineSdkSessionGlobal === "function") {
              sessionGlobalMod.autoInstallOrbisPorcupineSdkSessionGlobal();
            }
          } catch (_ignored) {}
        }
        if (typeof window !== "undefined") {
          bootState.hasBridge = !!window.OrbisPorcupineSdkBridge;
          bootState.hasHooks = !!window.OrbisPorcupineSdkHooks;
          bootState.hasFactory = typeof window[factoryName] === "function";
        }
      } catch (err) {
        if (!allowSimulation) throw err;
        const simFactory = installOrbisCreatePorcupineSdkSessionGlobal({
          simulate: true,
          simulationIntervalMs: Number(opts.simulationIntervalMs) || 1200,
        });
        bootState.reason = "sdk_script_missing_simulated";
        return installWithFactory(simFactory, "installed_simulated");
      }
    }

    const createSdkSession = resolveCreateSdkSession(factoryName);
    if (!createSdkSession) {
      if (allowSimulation) {
        const simFactory = installOrbisCreatePorcupineSdkSessionGlobal({
          simulate: true,
          simulationIntervalMs: Number(opts.simulationIntervalMs) || 1200,
        });
        bootState.reason = "sdk_factory_missing_simulated";
        return installWithFactory(simFactory, "installed_simulated");
      }
      bootState.reason = "sdk_factory_missing";
      return {
        installed: false,
        status: { ...bootState, init: getPorcupineInitStatus() },
      };
    }
    return installWithFactory(createSdkSession, "installed");
  } catch (err) {
    bootState.reason = err && err.message ? String(err.message) : "boot_failed";
    return {
      installed: false,
      status: { ...bootState, init: getPorcupineInitStatus() },
      error: err,
    };
  }
}

export function getLocalPorcupineBootStatus() {
  return { ...bootState, init: getPorcupineInitStatus() };
}
