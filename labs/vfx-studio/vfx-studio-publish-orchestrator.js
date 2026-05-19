import {
  publishLabProfile,
  writeConnectedProjectModule,
} from "../shell/lab-publish.js";

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
  afterLivePublish,
} = {}) {
  return publishLabProfile({
    built,
    contract,
    buildLiveModule: buildLivePresetModule,
    buildSecondaryModule: buildBehaviorModule,
    ensureProjectConnected,
    hasProjectConnection,
    saveConnectedPath,
    saveConnectedDraft,
    saveProjectFile,
    downloadTextFile,
    draftPathParts,
    describeLivePublishSuccess: describePublishSuccess,
    afterLivePublish,
    draftLabel: "draft",
    fileWriteMessage: "Preset written.",
  });
}

export async function writeRuntimeBindingModule({
  moduleText,
  targetPath,
  hasProjectConnection,
  saveConnectedPath,
  missingConnectionMessage,
  failureMessage,
} = {}) {
  return writeConnectedProjectModule({
    moduleText,
    targetPath,
    hasProjectConnection,
    saveConnectedPath,
    successLabel: "binding",
    missingConnectionMessage,
    failureMessage,
  });
}
