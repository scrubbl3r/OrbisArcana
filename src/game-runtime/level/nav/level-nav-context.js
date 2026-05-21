function clonePoint(point = {}) {
  return {
    xW: Number(point.xW) || 0,
    yW: Number(point.yW) || 0,
  };
}

function distance(from = {}, to = {}) {
  return Math.hypot((Number(from.xW) || 0) - (Number(to.xW) || 0), (Number(from.yW) || 0) - (Number(to.yW) || 0));
}

function resolveNavGrid(navGrid = null) {
  return navGrid && typeof navGrid === "object" ? navGrid : null;
}

export function createLevelNavContext({ navGrid = null } = {}) {
  const grid = resolveNavGrid(navGrid);
  return Object.freeze({
    kind: "level-nav-context",
    box: grid ? grid.box : null,
    cellSizeWorld: grid ? grid.cellSizeWorld : 0,
    cols: grid ? grid.cols : 0,
    rows: grid ? grid.rows : 0,
    resolutionBo: grid ? grid.resolutionBo : null,
    source: grid,
    containsPoint(point = {}) {
      return grid && typeof grid.containsPoint === "function"
        ? grid.containsPoint(point)
        : true;
    },
    resolvePoint(point = {}, options = {}) {
      return grid && typeof grid.resolvePoint === "function"
        ? grid.resolvePoint(point, options)
        : clonePoint(options && options.fallback ? options.fallback : point);
    },
    randomPointAround(center = {}, radius = 1, options = {}) {
      if (grid && typeof grid.randomPointAround === "function") {
        return grid.randomPointAround(center, radius, options);
      }
      const angle = Math.random() * Math.PI * 2;
      const r = Math.max(0, Number(radius) || 0) * Math.sqrt(Math.random());
      return {
        xW: (Number(center.xW) || 0) + Math.cos(angle) * r,
        yW: (Number(center.yW) || 0) + Math.sin(angle) * r,
      };
    },
    segmentIsWalkable(from = {}, to = {}, stepWorld = 1) {
      return grid && typeof grid.segmentIsWalkable === "function"
        ? grid.segmentIsWalkable(from, to, stepWorld)
        : true;
    },
    findPath(from = {}, to = {}) {
      return grid && typeof grid.findPath === "function"
        ? grid.findPath(from, to)
        : [clonePoint(from), clonePoint(to)];
    },
    distanceThroughLevel(from = {}, to = {}) {
      return grid && typeof grid.distanceThroughLevel === "function"
        ? grid.distanceThroughLevel(from, to)
        : distance(from, to);
    },
    buildRouteSegments(options = {}) {
      if (grid && typeof grid.buildRouteSegments === "function") return grid.buildRouteSegments(options);
      return [clonePoint(options && options.to ? options.to : {})];
    },
    getTrace() {
      return Object.freeze({
        nav: !!grid,
        navCells: grid ? (Number(grid.cols) || 0) * (Number(grid.rows) || 0) : 0,
        navResolutionBo: grid ? grid.resolutionBo : null,
      });
    },
  });
}
