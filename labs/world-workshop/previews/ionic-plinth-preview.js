function n(value) {
  return Number(value).toFixed(2);
}

function rect({ x, y, width, height, className = "" }) {
  return `<rect class="plinthFace ${className}" x="${n(x)}" y="${n(y)}" width="${n(width)}" height="${n(height)}" />`;
}

function line({ x1, y1, x2, y2, className = "" }) {
  return `<line class="plinthEdge ${className}" x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" />`;
}

function buildVolutePath({ cx, cy, outerRadius, inward = 1 }) {
  const samples = 52;
  const turns = 1.72;
  const points = [];
  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples;
    const angle = inward * (Math.PI * 2 * turns * t);
    const radius = outerRadius * (1 - t * 0.78);
    points.push([
      cx + Math.cos(angle) * radius,
      cy + Math.sin(angle) * radius,
    ]);
  }
  return points.map(([x, y], index) => `${index ? "L" : "M"}${n(x)} ${n(y)}`).join(" ");
}

function columnFacetLines({ centerX, topY, bottomY, width }) {
  const xs = [-0.36, -0.18, 0, 0.18, 0.36].map((ratio) => centerX + width * ratio);
  return xs.map((x) => line({
    x1: x,
    y1: topY,
    x2: x,
    y2: bottomY,
    className: "plinthColumnFacet",
  })).join("");
}

export function renderIonicPlinthPreview({
  root,
  orbDiameterPx,
} = {}) {
  if (!root) return null;

  const bo = Number(orbDiameterPx) || 72;
  const columnWidth = bo;
  const columnHeight = bo * 2;
  const capitalWidth = bo * 1.35;
  const baseWidth = bo * 1.35;
  const baseLowerHeight = bo * 0.18;
  const baseUpperHeight = bo * 0.14;
  const capVoluteHeight = bo * 0.34;
  const capBandHeight = bo * 0.13;
  const capSlabHeight = bo * 0.12;
  const viewWidth = bo * 2.2;
  const topMargin = bo * 0.72;
  const centerX = viewWidth * 0.5;
  const capTopY = topMargin;
  const capSlabY = capTopY;
  const capBandY = capSlabY + capSlabHeight;
  const capVoluteY = capBandY + capBandHeight;
  const columnTopY = capVoluteY + capVoluteHeight;
  const columnBottomY = columnTopY + columnHeight;
  const baseUpperY = columnBottomY;
  const baseLowerY = baseUpperY + baseUpperHeight;
  const bottomY = baseLowerY + baseLowerHeight;
  const viewHeight = bottomY + bo * 0.2;
  const columnX = centerX - columnWidth * 0.5;
  const capX = centerX - capitalWidth * 0.5;
  const baseX = centerX - baseWidth * 0.5;
  const capInnerX = centerX - capitalWidth * 0.43;
  const capInnerW = capitalWidth * 0.86;
  const baseUpperX = centerX - baseWidth * 0.43;
  const baseUpperW = baseWidth * 0.86;
  const voluteRadius = bo * 0.18;
  const voluteY = capVoluteY + capVoluteHeight * 0.5;
  const leftVoluteX = centerX - capitalWidth * 0.31;
  const rightVoluteX = centerX + capitalWidth * 0.31;

  root.innerHTML = `
    <svg class="ionicPlinthPreview" viewBox="0 0 ${n(viewWidth)} ${n(viewHeight)}" role="img" aria-label="Front elevation of minimal ionic orb spawn plinth">
      <g class="plinthScaleGuide" aria-hidden="true">
        <circle cx="${n(centerX)}" cy="${n(capTopY - bo * 0.5)}" r="${n(bo * 0.5)}" />
      </g>
      <g class="plinthObject" vector-effect="non-scaling-stroke">
        ${rect({
          x: capX,
          y: capSlabY,
          width: capitalWidth,
          height: capSlabHeight,
          className: "plinthCapitalSlab",
        })}
        ${rect({
          x: capX,
          y: capBandY,
          width: capitalWidth,
          height: capBandHeight,
          className: "plinthCapitalBand",
        })}
        ${rect({
          x: capInnerX,
          y: capVoluteY,
          width: capInnerW,
          height: capVoluteHeight,
          className: "plinthCapitalVoluteBlock",
        })}
        <path class="plinthEdge plinthVolute" d="${buildVolutePath({
          cx: leftVoluteX,
          cy: voluteY,
          outerRadius: voluteRadius,
          inward: -1,
        })}" />
        <path class="plinthEdge plinthVolute" d="${buildVolutePath({
          cx: rightVoluteX,
          cy: voluteY,
          outerRadius: voluteRadius,
          inward: 1,
        })}" />
        ${rect({
          x: columnX,
          y: columnTopY,
          width: columnWidth,
          height: columnHeight,
          className: "plinthColumn",
        })}
        ${columnFacetLines({
          centerX,
          topY: columnTopY,
          bottomY: columnBottomY,
          width: columnWidth,
        })}
        ${rect({
          x: baseUpperX,
          y: baseUpperY,
          width: baseUpperW,
          height: baseUpperHeight,
          className: "plinthBaseUpper",
        })}
        ${rect({
          x: baseX,
          y: baseLowerY,
          width: baseWidth,
          height: baseLowerHeight,
          className: "plinthBaseLower",
        })}
      </g>
    </svg>
  `;

  return {
    bo,
    columnWidth,
    columnHeight,
    capitalWidth,
    baseWidth,
  };
}
