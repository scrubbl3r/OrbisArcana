export async function publishLabPreset({
  built,
  contract,
  buildLivePresetModule,
  buildBehaviorModule,
  ensureProjectConnected,
  hasProjectConnection,
  saveConnectedPath,
  saveConnectedDraft,
  saveProjectFile,
  downloadTextFile,
  draftPathParts,
  describePublishSuccess,
} = {}) {
  if (!built || !built.payload) return { ok: false, aborted: true };
  const payloadText = JSON.stringify(built.payload, null, 2);
  let projectConnected = !!hasProjectConnection;

  try {
    if (!projectConnected && typeof ensureProjectConnected === "function") {
      const connected = await ensureProjectConnected();
      if (!connected) return { ok: false, aborted: true };
      projectConnected = true;
    }

    if (projectConnected) {
      const liveTarget = contract && contract.livePreset ? contract.livePreset : null;
      const behaviorTarget = contract && contract.behavior ? contract.behavior : null;
      const canPublishBehavior = !!behaviorTarget && typeof buildBehaviorModule === "function";
      if (liveTarget && typeof buildLivePresetModule === "function") {
        const moduleText = buildLivePresetModule(built.payload.params);
        if (moduleText) {
          const publishedPaths = [];
          let ok = await saveConnectedPath(liveTarget.path, moduleText);
          if (ok) publishedPaths.push(liveTarget.path);
          if (ok && canPublishBehavior) {
            const behaviorModuleText = buildBehaviorModule(built.payload.params);
            ok = await saveConnectedPath(behaviorTarget.path, behaviorModuleText);
            if (ok) publishedPaths.push(behaviorTarget.path);
          }
          if (ok) {
            return {
              ok: true,
              kind: "live",
              message: typeof describePublishSuccess === "function"
                ? describePublishSuccess({ publishedPaths, contract })
                : "Published.",
            };
          }
        }
      }

      const ok = await saveConnectedDraft(built.filename, payloadText);
      if (ok) {
        return {
          ok: true,
          kind: "draft",
          message: `Published draft to ${Array.isArray(draftPathParts) ? draftPathParts.join("/") : ""}/${built.filename}`,
        };
      }
    }

    const ok = await saveProjectFile(built.filename, payloadText);
    if (ok) return { ok: true, kind: "file", message: "Preset written." };

    downloadTextFile(built.filename, payloadText);
    return { ok: true, kind: "download", message: null };
  } catch (err) {
    if (err && err.name === "AbortError") return { ok: false, aborted: true };
    downloadTextFile(built.filename, JSON.stringify(built.payload, null, 2));
    return { ok: false, downloadedFallback: true, error: err };
  }
}

export async function writeRuntimeBindingModule({
  moduleText,
  targetPath,
  hasProjectConnection,
  saveConnectedPath,
  missingConnectionMessage,
  failureMessage,
} = {}) {
  if (!hasProjectConnection) {
    return { ok: false, needsConnection: true, message: missingConnectionMessage || "Connect Project first." };
  }
  try {
    const ok = await saveConnectedPath(targetPath, moduleText);
    if (ok) {
      return { ok: true, message: `Published binding to ${Array.isArray(targetPath) ? targetPath.join("/") : String(targetPath || "")}` };
    }
    throw new Error("Binding write failed");
  } catch (err) {
    if (err && err.name === "AbortError") return { ok: false, aborted: true };
    return {
      ok: false,
      error: err,
      message: failureMessage || "Binding publish failed. No fallback export was created. Reconnect the project and try again.",
    };
  }
}
