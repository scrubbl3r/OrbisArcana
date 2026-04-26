const ISO_X = 0.82;
const ISO_Z = 0.44;

function point3(x, y, z, origin) {
  return [
    origin.x + (x - z) * ISO_X,
    origin.y - y + (x + z) * ISO_Z,
  ];
}

function pathFromPoints(points) {
  return points.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ") + " Z";
}

function facePath(points, origin) {
  return pathFromPoints(points.map(([x, y, z]) => point3(x, y, z, origin)));
}

function polygonPoints(radius, sides = 9) {
  return Array.from({ length: sides }, (_, index) => {
    const angle = -Math.PI * 0.5 + (Math.PI * 2 * index) / sides;
    return [Math.cos(angle) * radius, Math.sin(angle) * radius];
  });
}

function prismFaces({ topY, bottomY, points, origin, className = "" }) {
  const faces = [];
  for (let i = 0; i < points.length; i += 1) {
    const next = (i + 1) % points.length;
    const [x1, z1] = points[i];
    const [x2, z2] = points[next];
    faces.push({
      className,
      d: facePath([
        [x1, bottomY, z1],
        [x2, bottomY, z2],
        [x2, topY, z2],
        [x1, topY, z1],
      ], origin),
      depth: z1 + z2,
    });
  }
  faces.push({
    className,
    d: facePath(points.map(([x, z]) => [x, topY, z]), origin),
    depth: 9999,
  });
  return faces.sort((a, b) => a.depth - b.depth);
}

function squarePrism({ halfWidth, halfDepth = halfWidth, topY, bottomY, origin, className = "" }) {
  return prismFaces({
    topY,
    bottomY,
    origin,
    className,
    points: [
      [-halfWidth, -halfDepth],
      [halfWidth, -halfDepth],
      [halfWidth, halfDepth],
      [-halfWidth, halfDepth],
    ],
  });
}

function buildVolutePath({ cx, cy, radius, clockwise = true }) {
  const turns = 1.65;
  const samples = 42;
  const points = [];
  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples;
    const angle = (clockwise ? 1 : -1) * (Math.PI * 2 * turns * t);
    const r = radius * (1 - t * 0.74);
    points.push([
      cx + Math.cos(angle) * r,
      cy + Math.sin(angle) * r,
    ]);
  }
  return points.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
}

function faceMarkup(faces) {
  return faces.map((face) => `<path class="plinthFace ${face.className}" d="${face.d}" />`).join("");
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
  const capBandHeight = bo * 0.16;
  const capCurlHeight = bo * 0.28;
  const capSlabHeight = bo * 0.12;
  const y0 = 0;
  const y1 = y0 + baseLowerHeight;
  const y2 = y1 + baseUpperHeight;
  const columnTop = y2 + columnHeight;
  const capCurlTop = columnTop + capCurlHeight;
  const capBandTop = capCurlTop + capBandHeight;
  const capTop = capBandTop + capSlabHeight;
  const origin = { x: 260, y: 340 };

  const faces = [
    ...squarePrism({
      halfWidth: baseWidth * 0.5,
      halfDepth: baseWidth * 0.5,
      bottomY: y0,
      topY: y1,
      origin,
      className: "plinthBaseLower",
    }),
    ...squarePrism({
      halfWidth: baseWidth * 0.43,
      halfDepth: baseWidth * 0.43,
      bottomY: y1,
      topY: y2,
      origin,
      className: "plinthBaseUpper",
    }),
    ...prismFaces({
      points: polygonPoints(columnWidth * 0.5, 9),
      bottomY: y2,
      topY: columnTop,
      origin,
      className: "plinthColumn",
    }),
    ...squarePrism({
      halfWidth: capitalWidth * 0.47,
      halfDepth: capitalWidth * 0.34,
      bottomY: columnTop,
      topY: capCurlTop,
      origin,
      className: "plinthCapitalCurlBlock",
    }),
    ...squarePrism({
      halfWidth: capitalWidth * 0.5,
      halfDepth: capitalWidth * 0.38,
      bottomY: capCurlTop,
      topY: capBandTop,
      origin,
      className: "plinthCapitalBand",
    }),
    ...squarePrism({
      halfWidth: capitalWidth * 0.54,
      halfDepth: capitalWidth * 0.42,
      bottomY: capBandTop,
      topY: capTop,
      origin,
      className: "plinthCapitalSlab",
    }),
  ];

  const leftCurl = buildVolutePath({
    cx: origin.x - capitalWidth * 0.27,
    cy: origin.y - columnTop - capCurlHeight * 0.42,
    radius: bo * 0.17,
    clockwise: false,
  });
  const rightCurl = buildVolutePath({
    cx: origin.x + capitalWidth * 0.27,
    cy: origin.y - columnTop - capCurlHeight * 0.42,
    radius: bo * 0.17,
    clockwise: true,
  });
  const collarY = origin.y - columnTop - capCurlHeight * 0.42;

  root.innerHTML = `
    <svg class="ionicPlinthPreview" viewBox="0 0 520 390" role="img" aria-label="Minimal ionic orb spawn plinth">
      <g class="plinthObject" vector-effect="non-scaling-stroke">
        ${faceMarkup(faces)}
        <path class="plinthEdge plinthVolute" d="${leftCurl}" />
        <path class="plinthEdge plinthVolute" d="${rightCurl}" />
        <path class="plinthEdge plinthCollar" d="M${(origin.x - capitalWidth * 0.34).toFixed(2)} ${collarY.toFixed(2)} L${(origin.x + capitalWidth * 0.34).toFixed(2)} ${collarY.toFixed(2)}" />
      </g>
      <g class="plinthScaleGuide" aria-hidden="true">
        <circle cx="${origin.x}" cy="${(origin.y - capTop - bo * 0.58).toFixed(2)}" r="${(bo * 0.5).toFixed(2)}" />
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
