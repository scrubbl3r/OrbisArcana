export function createInputHudPanelRefs(root) {
  if (!root) return null;
  const $ = (id) => root.querySelector(`#${id}`);
  return {
    root,
    vLift: $("vLift"),
    vGroove: $("vGroove"),
    vSmooth: $("vSmooth"),
    vSpeed: $("vSpeed"),
    vDynamics: $("vDynamics"),
    vEnergy: $("vEnergy"),
    vShake: $("vShake"),
    bLift: $("bLift"),
    bGroove: $("bGroove"),
    bSmooth: $("bSmooth"),
    bSpeed: $("bSpeed"),
    bDynamics: $("bDynamics"),
    bEnergy: $("bEnergy"),
    bShake: $("bShake"),
    dynLampStable: $("dynLampStable"),
    dynLampVar: $("dynLampVar"),
    shakeLamp: $("shakeLamp"),
    lampUp: $("lampUp"),
    lampDown: $("lampDown"),
    lampLeft: $("lampLeft"),
    lampRight: $("lampRight"),
    lampForward: $("lampForward"),
    lampBack: $("lampBack"),
  };
}
