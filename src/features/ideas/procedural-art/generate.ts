import { createRandom } from "./random.js";
import type { ArtPrimitive, ArtScene, ArtTone } from "./scene.js";

type Random = ReturnType<typeof createRandom>;
type Generator = (geometry: Random, details: Random) => ArtPrimitive[];
const TAU = Math.PI * 2;
const coordinate = (value: number) => Number(value.toFixed(3));

function line(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  stroke: ArtTone = "border",
): ArtPrimitive {
  return {
    kind: "path",
    d: `M ${coordinate(x1)} ${coordinate(y1)} L ${coordinate(x2)} ${coordinate(y2)}`,
    stroke,
  };
}

function cross(x: number, y: number, size = 5): ArtPrimitive {
  return {
    kind: "path",
    d: `M ${coordinate(x - size)} ${coordinate(y)} h ${size * 2} M ${coordinate(x)} ${coordinate(y - size)} v ${size * 2}`,
    stroke: "border-strong",
  };
}

const drafting: Generator = (random, details) => {
  const x = coordinate(random(480, 610));
  const y = coordinate(random(95, 145));
  const radius = coordinate(random(48, 72));
  const shapes: ArtPrimitive[] = [];
  // A local construction grid, with open paper on either side.
  for (let index = 0; index < 6; index++) {
    shapes.push(line(x - 110 + index * 40, 34, x - 110 + index * 40, 206));
  }
  for (let index = 0; index < 4; index++) {
    shapes.push(line(x - 130, 50 + index * 40, x + 130, 50 + index * 40));
  }
  shapes.push(
    {
      kind: "rect",
      x: x - radius,
      y: y - radius,
      width: radius * 2,
      height: radius * 2,
      fill: "surface-muted",
      opacity: 0.7,
    },
    {
      kind: "ellipse",
      cx: x,
      cy: y,
      rx: radius,
      ry: radius,
      stroke: "border-strong",
    },
    {
      kind: "path",
      d: `M ${x} ${y - radius} A ${radius} ${radius} 0 0 1 ${x + radius} ${y} H ${x + 175}`,
      stroke: "primary",
      opacity: 0.65,
      strokeWidth: 1.5,
    },
    line(x - radius - 25, y, x + radius + 25, y),
    line(x, y - radius - 20, x, y + radius + 20),
    cross(x, y),
    line(x - radius, 218, x + radius, 218, "border-strong"),
    line(x - radius, 214, x - radius, 222, "border-strong"),
    line(x + radius, 214, x + radius, 222, "border-strong"),
    {
      kind: "rect",
      x: x + 171,
      y: y - 3,
      width: 6,
      height: 6,
      fill: "accent",
      opacity: 0.65,
    },
  );
  const offset = coordinate(details(230, 290));
  shapes.push(cross(x + offset, 64), line(x + offset, 82, x + offset, 156));
  return shapes;
};

const contours: Generator = (random, details) => {
  const cx = random(530, 650);
  const cy = random(125, 170);
  const rx = random(155, 205);
  const ry = random(80, 110);
  const phase = random(0, TAU);
  const phase2 = random(0, TAU);
  const shapes: ArtPrimitive[] = [];
  // Shared harmonics keep the rings nested; 96 segments per ring bounds cost.
  for (let ring = 0; ring < 8; ring++) {
    const scale = 0.25 + ring * 0.145;
    const points: string[] = [];
    for (let step = 0; step < 96; step++) {
      const angle = (step / 96) * TAU;
      const distortion =
        1 +
        0.13 * Math.sin(angle * 3 + phase) +
        0.07 * Math.cos(angle * 5 + phase2);
      const x = cx + Math.cos(angle) * rx * scale * distortion;
      const y = cy + Math.sin(angle) * ry * scale * distortion;
      points.push(
        `${step === 0 ? "M" : "L"} ${coordinate(x)} ${coordinate(y)}`,
      );
    }
    shapes.push({
      kind: "path",
      d: `${points.join(" ")} Z`,
      stroke:
        ring === 3 ? "primary" : ring % 3 === 0 ? "border-strong" : "border",
      opacity: ring === 3 ? 0.55 : 0.85,
    });
  }
  shapes.push(cross(coordinate(cx), coordinate(cy), 4));
  const markX = coordinate(cx + details(235, 280));
  shapes.push(
    line(markX, 76, markX, 148),
    line(markX - 5, 76, markX + 5, 76),
    line(markX - 5, 148, markX + 5, 148),
  );
  return shapes;
};

const editorial: Generator = (random, details) => {
  const x = coordinate(random(470, 580));
  const y = coordinate(random(90, 120));
  const radius = coordinate(random(50, 72));
  const width = coordinate(random(95, 145));
  const shapes: ArtPrimitive[] = [
    {
      kind: "ellipse",
      cx: x,
      cy: y,
      rx: radius,
      ry: radius,
      fill: "surface-muted",
    },
    {
      kind: "rect",
      x: x + 24,
      y: y - 30,
      width,
      height: 100,
      stroke: "border-strong",
    },
    {
      kind: "path",
      d: `M ${x - radius} ${y} A ${radius} ${radius} 0 0 1 ${x + radius} ${y}`,
      stroke: "primary",
      opacity: 0.6,
      strokeWidth: 1.5,
    },
    {
      kind: "rect",
      x: x + width + 50,
      y: y + 38,
      width: 50,
      height: 32,
      fill: "primary",
      opacity: 0.16,
    },
    line(x - 175, y + 70, x + 280, y + 70, "border-strong"),
    line(x + 24, 30, x + 24, 212),
    {
      kind: "rect",
      x: x - 130,
      y: y + 64,
      width: 20,
      height: 3,
      fill: "accent",
      opacity: 0.7,
    },
  ];
  const count = Math.floor(details(5, 9));
  for (let index = 0; index < count; index++) {
    shapes.push(
      line(x + width + 50 + index * 7, 50, x + width + 50 + index * 7, 70),
    );
  }
  return shapes;
};

const orbital: Generator = (random, details) => {
  const cx = coordinate(random(540, 640));
  const cy = coordinate(random(100, 140));
  const rx = coordinate(random(160, 210));
  const ry = coordinate(random(40, 64));
  const rotation = coordinate(random(-18, 18));
  const shapes: ArtPrimitive[] = [
    { kind: "ellipse", cx, cy, rx, ry, rotation, stroke: "border-strong" },
    {
      kind: "ellipse",
      cx,
      cy,
      rx: rx * 0.73,
      ry: ry * 1.5,
      rotation: rotation - 30,
      stroke: "border",
    },
    {
      kind: "ellipse",
      cx,
      cy,
      rx: 30,
      ry: 30,
      fill: "surface-muted",
      stroke: "border",
    },
    line(cx - 270, cy, cx + 270, cy),
    line(cx, cy - 80, cx, cy + 80),
    cross(cx, cy),
  ];
  const angle = details(0.2, 2.7);
  const turn = (rotation * Math.PI) / 180;
  const nodeX = coordinate(
    cx +
      rx * Math.cos(angle) * Math.cos(turn) -
      ry * Math.sin(angle) * Math.sin(turn),
  );
  const nodeY = coordinate(
    cy +
      rx * Math.cos(angle) * Math.sin(turn) +
      ry * Math.sin(angle) * Math.cos(turn),
  );
  shapes.push(
    { ...line(cx, cy, nodeX, nodeY, "primary"), opacity: 0.45, dash: "3 6" },
    {
      kind: "ellipse",
      cx: nodeX,
      cy: nodeY,
      rx: 4,
      ry: 4,
      fill: "accent",
      opacity: 0.7,
    },
    {
      kind: "path",
      d: `M ${cx - 90} ${cy - 60} Q ${cx + 120} ${cy - 125} ${cx + 260} ${cy - 30}`,
      stroke: "primary",
      opacity: 0.5,
    },
    cross(cx + 260, cy - 30, 4),
  );
  return shapes;
};

// Frozen slots: never append, reorder, or replace v1 families. A future v2 gets
// its own mapping and namespaces, while this entry point continues to use v1.
const V1_FAMILIES = Object.freeze([
  "drafting",
  "contours",
  "editorial",
  "orbital",
] as const);
const V1_GENERATORS: Readonly<Record<ArtScene["family"], Generator>> =
  Object.freeze({ drafting, contours, editorial, orbital });

export function generateIdeaScene(ideaId: string): ArtScene {
  const family =
    V1_FAMILIES[Math.floor(createRandom(ideaId, "family:v1")() * 4)];
  return {
    version: "v1",
    family,
    primitives: V1_GENERATORS[family](
      createRandom(ideaId, `geometry:v1:${family}`),
      createRandom(ideaId, `details:v1:${family}`),
    ),
  };
}
