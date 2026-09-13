import {
  arc,
  cross,
  dot,
  ellipse,
  ink,
  line,
  path,
  point,
  type ArtVariant,
  type Point,
  type VariantGenerator,
} from "../primitives.js";
import type { ArtPrimitive } from "../scene.js";

function orbitPoint(
  x: number,
  y: number,
  rx: number,
  ry: number,
  angle: number,
  rotation = 0,
): Point {
  const turn = (rotation * Math.PI) / 180;
  return [
    x +
      rx * Math.cos(angle) * Math.cos(turn) -
      ry * Math.sin(angle) * Math.sin(turn),
    y +
      rx * Math.cos(angle) * Math.sin(turn) +
      ry * Math.sin(angle) * Math.cos(turn),
  ];
}
function nodeRay(x: number, y: number, target: Point): ArtPrimitive[] {
  return [
    { ...ink(line(x, y, ...target)), dash: "3 6", opacity: 0.45 },
    dot(...target),
  ];
}

// A highlighted segment uses the same rotation and parameterization as its
// ellipse and node. Keep this orbital-specific helper local to the family.
function orbitArc(
  x: number,
  y: number,
  rx: number,
  ry: number,
  start: number,
  end: number,
  rotation: number,
): ArtPrimitive {
  return path(
    `M ${point(orbitPoint(x, y, rx, ry, start, rotation))} A ${rx} ${ry} ${rotation} ${end - start > Math.PI ? 1 : 0} 1 ${point(orbitPoint(x, y, rx, ry, end, rotation))}`,
    "border-strong",
  );
}

const concentricSystem: VariantGenerator = ({ geometry: g, details: d }) => {
  // This existing V2 slot restores V1 verbatim in composition: rounded anchors,
  // ellipse proportions, paint order, weights, node range, and quadratic sweep.
  const x = Number(g(540, 640).toFixed(3)),
    y = Number(g(100, 140).toFixed(3)),
    rx = Number(g(160, 210).toFixed(3)),
    ry = Number(g(40, 64).toFixed(3)),
    rotation = Number(g(-18, 18).toFixed(3));
  const shapes: ArtPrimitive[] = [
    { ...ellipse(x, y, rx, ry), rotation },
    {
      kind: "ellipse",
      cx: x,
      cy: y,
      rx: rx * 0.73,
      ry: ry * 1.5,
      rotation: rotation - 30,
      stroke: "border",
    },
    { ...ellipse(x, y, 30), fill: "surface-muted", stroke: "border" },
    line(x - 270, y, x + 270, y),
    line(x, y - 80, x, y + 80),
    cross(x, y, 5),
  ];
  const node = orbitPoint(x, y, rx, ry, d(0.2, 2.7), rotation),
    nodeX = Number(node[0].toFixed(3)),
    nodeY = Number(node[1].toFixed(3));
  shapes.push(
    { ...line(x, y, nodeX, nodeY, "primary"), opacity: 0.45, dash: "3 6" },
    {
      ...ellipse(nodeX, nodeY, 4),
      fill: "accent",
      stroke: undefined,
      opacity: 0.7,
    },
    {
      ...path(
        `M ${x - 90} ${y - 60} Q ${x + 120} ${y - 125} ${x + 260} ${y - 30}`,
        "primary",
      ),
      opacity: 0.5,
    },
    cross(x + 260, y - 30, 4),
  );
  return shapes;
};

const eccentricOrbit: VariantGenerator = ({
  geometry: g,
  details: d,
  accent: a,
}) => {
  const focus = g(475, 525),
    y = g(110, 125),
    eccentricity = g(0.46, 0.56),
    radius = g(230, 255),
    ratio = g(0.32, 0.38);
  const count = Math.floor(d(3, 5));
  const shapes: ArtPrimitive[] = [];
  // Every projected ellipse has the same left focal position and eccentricity.
  // Vertical flattening is shared, as in an inclined planar orbital system.
  for (let i = 0; i < count; i++) {
    const rx = radius * (0.48 + (0.52 * i) / (count - 1));
    shapes.push(
      ellipse(
        focus + rx * eccentricity,
        y,
        rx,
        rx * ratio,
        i === count - 1 ? "border-strong" : "border",
      ),
    );
  }
  const center = focus + radius * eccentricity;
  // Rotate a smaller projected orbit about the same focus, not about its own
  // center. This preserves the focal relationship while crossing the nest.
  const projectedRadius = radius * 0.74,
    rotation = d(-12, -8),
    projectedCenter = orbitPoint(
      focus,
      y,
      projectedRadius * eccentricity,
      0,
      0,
      rotation,
    ),
    angle = a(0.5, 2.6);
  shapes.push(
    {
      ...ellipse(
        ...projectedCenter,
        projectedRadius,
        projectedRadius * ratio,
        "border",
      ),
      rotation,
    },
    line(center - radius - 20, y, center + radius + 20, y),
    line(center, y - radius * ratio - 12, center, y + radius * ratio + 12),
    { ...ellipse(focus, y, 20), fill: "surface-muted", stroke: "border" },
    cross(focus, y),
    cross(center - radius, y),
    ink(arc(center, y, radius, radius * ratio, angle - 0.35, angle)),
    ...nodeRay(focus, y, orbitPoint(center, y, radius, radius * ratio, angle)),
  );
  return shapes;
};

const dualFocus: VariantGenerator = ({
  geometry: g,
  details: d,
  accent: a,
}) => {
  const x = g(575, 620),
    y = g(112, 127),
    focal = g(95, 120),
    rx = g(240, 265),
    flatten = g(0.35, 0.4);
  const ry = Math.sqrt(rx * rx - focal * focal) * flatten;
  const shapes: ArtPrimitive[] = [
    line(x - rx - 20, y, x + rx + 20, y),
    ellipse(x, y, rx, ry),
  ];
  const inner = rx - d(32, 50);
  shapes.push(
    ellipse(
      x,
      y,
      inner,
      Math.sqrt(inner * inner - focal * focal) * flatten,
      "border",
    ),
    { ...ellipse(x - focal, y, 18), fill: "surface-muted", stroke: "border" },
    line(x, y - ry - 12, x, y + ry + 12),
    // The upper tangent and its registration cross belong to the outer orbit.
    line(x - 35, y - ry, x + focal + 36, y - ry),
    cross(x, y - ry),
    cross(x - focal, y),
    cross(x + focal, y),
  );
  const angle = a(0.65, 2.5),
    node = orbitPoint(x, y, rx, ry, angle);
  shapes.push(
    ink(arc(x, y, rx, ry, angle - 0.35, angle)),
    { ...line(x - focal, y, ...node, "primary"), opacity: 0.45, dash: "3 6" },
    line(x + focal, y, ...node),
    dot(...node),
  );
  return shapes;
};

const sweepingTrajectory: VariantGenerator = ({
  geometry: g,
  details: d,
  accent: a,
}) => {
  const x = g(570, 620),
    y = g(183, 198),
    rx = g(250, 290),
    ry = g(140, 160);
  const start = Math.PI + 0.12,
    end = Math.PI * 2 - 0.12;
  const shapes: ArtPrimitive[] = [];
  const count = Math.floor(d(3, 5));
  for (let i = 0; i < count; i++) {
    const scale = 0.6 + (0.4 * i) / (count - 1);
    shapes.push({
      ...arc(x, y, rx * scale, ry * scale, start, end),
      stroke: i === count - 1 ? "border-strong" : "border",
    });
  }
  const left = orbitPoint(x, y, rx, ry, start),
    right = orbitPoint(x, y, rx, ry, end),
    angle = a(3.8, 5.6);
  shapes.push(
    // A low inclined plane shares the sweep's center and sits near its foot,
    // preserving the broad open interior of the dominant trajectories.
    { ...ellipse(x, y, rx * 0.56, ry * 0.13, "border"), rotation: -8 },
    line(...left, ...right),
    { ...ellipse(x, y, 19), fill: "surface-muted", stroke: "border" },
    cross(x, y),
    cross(...right),
    ink(arc(x, y, rx, ry, angle - 0.25, angle)),
    ...nodeRay(x, y, orbitPoint(x, y, rx, ry, angle)),
  );
  return shapes;
};

const radialDiagram: VariantGenerator = ({
  geometry: g,
  details: d,
  accent: a,
}) => {
  const x = g(565, 620),
    y = g(112, 125),
    rx = g(230, 260),
    ry = g(80, 95);
  const shapes: ArtPrimitive[] = [
    ellipse(x, y, rx, ry),
    { ...ellipse(x, y, rx * 0.78, ry * 0.63, "border"), rotation: -14 },
    { ...ellipse(x, y, 22), fill: "surface-muted", stroke: "border" },
    line(x - rx - 15, y, x + rx + 15, y),
    line(x, y - ry - 12, x, y + ry + 12),
    cross(x, y),
  ];
  // A short registration interval replaces the full protractor and repeated
  // spokes. Only the inclined plane's radius and focal node get radial lines.
  const count = Math.floor(d(4, 7));
  for (let i = 0; i < count; i++) {
    const angle = -2.9 + (i * 0.8) / (count - 1);
    const from = orbitPoint(x, y, rx, ry, angle),
      to = orbitPoint(x, y, rx + 9, ry + 5, angle);
    shapes.push(line(...from, ...to, "border-strong"));
  }
  const angle = a(-2.5, -0.5);
  shapes.push(
    line(x, y, ...orbitPoint(x, y, rx * 0.78, ry * 0.63, Math.PI, -14)),
    ink(arc(x, y, rx, ry, angle - 0.25, angle)),
    ...nodeRay(x, y, orbitPoint(x, y, rx, ry, angle)),
  );
  return shapes;
};

const intersectingPlanes: VariantGenerator = ({
  geometry: g,
  details: d,
  accent: a,
}) => {
  const x = g(560, 625),
    y = g(112, 127),
    rx = g(235, 260),
    ry = g(52, 64),
    rotation = g(8, 15),
    secondaryRotation = rotation - g(30, 38);
  const shapes: ArtPrimitive[] = [
    { ...ellipse(x, y, rx, ry), rotation },
    {
      ...ellipse(x, y, rx * 0.82, ry * 1.25, "border"),
      rotation: secondaryRotation,
    },
    { ...ellipse(x, y, 26), fill: "surface-muted", stroke: "border" },
    line(
      ...orbitPoint(x, y, rx + 22, ry, Math.PI, rotation),
      ...orbitPoint(x, y, rx + 22, ry, 0, rotation),
    ),
    cross(x, y),
  ];
  if (d() > 0.45) shapes.push(line(x, y - 95, x, y + 95));
  const angle = a(0.4, 2.7);
  shapes.push(
    // Preserve the two-plane silhouette; highlight a segment on the actual
    // foreground ellipse and register the background plane's major endpoint.
    cross(
      ...orbitPoint(x, y, rx * 0.82, ry * 1.25, Math.PI, secondaryRotation),
    ),
    ink(orbitArc(x, y, rx, ry, angle - 0.35, angle, rotation)),
    ...nodeRay(x, y, orbitPoint(x, y, rx, ry, angle, rotation)),
  );
  return shapes;
};

export const orbital = Object.freeze([
  { name: "concentric-system", generate: concentricSystem },
  { name: "eccentric-orbit", generate: eccentricOrbit },
  { name: "dual-focus", generate: dualFocus },
  { name: "sweeping-trajectory", generate: sweepingTrajectory },
  { name: "radial-diagram", generate: radialDiagram },
  { name: "intersecting-planes", generate: intersectingPlanes },
] satisfies ArtVariant[]);
