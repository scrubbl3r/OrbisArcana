export const ORB_RUNTIME_CONFIG_DEFAULT = {
  shieldDescent: {
    vDownThr: 60,
    graceMs: 260,
  },
  physics: {
    groundFromBottomPx: 17,
    groundLinePx: 2,
    orbRadiusPx: 50,
    gBase: 2200,
    thrustMax: 3000,
    upDrag: 2.6,
    downDrag: -1.7,
    bounce: 0.35,
    maxUpSpeed: 2200,
    maxDownSpeed: 2800,
  },
  impact: {
    threshold: 500,
    model: {
      mass: 1.0,
      gravityExp: 0.5,
      dragMirrorScale: 0.5,
    },
  },
};
