import {
  arc,
  cross,
  dot,
  ellipse,
  ink,
  line,
  measure,
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

const concentricSystem: VariantGenerator = ({
  geometry: g,
  details: d,
  accent: a,
}) => {
  const x = g(565, 625),
    y = g(112, 128),
    rx = g(225, 260),
    ry = g(76, 94);
  const count = Math.floor(d(3, 5));
  const shapes: ArtPrimitive[] = [
    line(x - rx - 20, y, x + rx + 20, y),
    line(x, y - ry - 12, x, y + ry + 12),
  ];
  for (let i = 0; i < count; i++) {
    const scale = 0.4 + (0.6 * i) / (count - 1);
    shapes.push(
      ellipse(
        x,
        y,
        rx * scale,
        ry * scale,
        i === count - 1 ? "border-strong" : "border",
      ),
    );
  }
  shapes.push(
    { ...ellipse(x, y, 22), fill: "surface-muted", stroke: "border" },
    cross(x, y),
    ...nodeRay(x, y, orbitPoint(x, y, rx, ry, a(0.35, 2.7))),
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
  shapes.push(
    line(center - radius - 20, y, center + radius + 20, y),
    { ...ellipse(focus, y, 20), fill: "surface-muted", stroke: "border" },
    cross(focus, y),
    ...nodeRay(
      focus,
      y,
      orbitPoint(center, y, radius, radius * ratio, a(0.5, 2.6)),
    ),
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
    cross(x - focal, y),
    cross(x + focal, y),
  );
  const node = orbitPoint(x, y, rx, ry, a(0.65, 2.5));
  shapes.push(
    { ...line(x - focal, y, ...node, "primary"), opacity: 0.45 },
    { ...line(x + focal, y, ...node, "primary"), opacity: 0.45 },
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
    right = orbitPoint(x, y, rx, ry, end);
  shapes.push(
    line(...left, ...right),
    { ...ellipse(x, y, 19), fill: "surface-muted", stroke: "border" },
    cross(x, y),
    ...nodeRay(x, y, orbitPoint(x, y, rx, ry, a(3.8, 5.6))),
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
    ellipse(x, y, rx * 0.62, ry * 0.62, "border"),
    line(x - rx - 15, y, x + rx + 15, y),
    cross(x, y),
  ];
  const count = Math.floor(d(7, 10));
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI + (i * Math.PI) / (count - 1);
    const from = orbitPoint(x, y, rx, ry, angle),
      to = orbitPoint(x, y, rx + 9, ry + 5, angle);
    shapes.push(line(...from, ...to, "border-strong"));
    if (i % 2 === 0) shapes.push(line(x, y, ...from));
  }
  shapes.push(
    ...measure(x - rx, y + ry + 15, rx * 2),
    ...nodeRay(x, y, orbitPoint(x, y, rx, ry, a(-2.5, -0.5))),
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
    rotation = g(8, 15);
  const shapes: ArtPrimitive[] = [
    { ...ellipse(x, y, rx, ry), rotation },
    {
      ...ellipse(x, y, rx * 0.82, ry * 1.25, "border"),
      rotation: rotation - g(30, 38),
    },
    { ...ellipse(x, y, 26), fill: "surface-muted", stroke: "border" },
    line(
      ...orbitPoint(x, y, rx + 22, ry, Math.PI, rotation),
      ...orbitPoint(x, y, rx + 22, ry, 0, rotation),
    ),
    cross(x, y),
  ];
  if (d() > 0.45) shapes.push(line(x, y - 95, x, y + 95));
  shapes.push(
    ...nodeRay(x, y, orbitPoint(x, y, rx, ry, a(0.4, 2.7), rotation)),
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
