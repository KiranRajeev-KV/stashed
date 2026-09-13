import {
  cross,
  line,
  trace,
  TAU,
  type ArtVariant,
  type Point,
  type VariantGenerator,
} from "../primitives.js";
import type { ArtPrimitive } from "../scene.js";

// All rings in a terrain object share one deformation field. The sampler is
// geometry-only; each composition below owns its silhouette and contour levels.
function contour(
  curve: (angle: number) => Point,
  index: number,
  samples: 96 | 128 = 128,
): ArtPrimitive {
  const points = Array.from({ length: samples }, (_, i) =>
    curve((i / samples) * TAU),
  );
  return {
    ...trace(
      points,
      index === 3 ? "primary" : index % 3 === 0 ? "border-strong" : "border",
      true,
    ),
    opacity: index === 3 ? 0.55 : 0.85,
  };
}

const basin: VariantGenerator = ({ geometry: g, details: d }) => {
  // Restore V1's silhouette and sampling exactly within this existing V2 slot.
  // Both phases belong to one shared field; only the ring scale changes.
  const x = g(530, 650),
    y = g(125, 170),
    rx = g(155, 205),
    ry = g(80, 110),
    phase = g(0, TAU),
    phase2 = g(0, TAU);
  const shapes: ArtPrimitive[] = [];
  for (let i = 0; i < 8; i++) {
    const scale = 0.25 + i * 0.145;
    shapes.push(
      contour(
        (t) => {
          const r =
            1 +
            0.13 * Math.sin(t * 3 + phase) +
            0.07 * Math.cos(t * 5 + phase2);
          return [
            x + Math.cos(t) * rx * scale * r,
            y + Math.sin(t) * ry * scale * r,
          ];
        },
        i,
        96,
      ),
    );
  }
  shapes.push(cross(Number(x.toFixed(3)), Number(y.toFixed(3)), 4));
  const markX = Number((x + d(235, 280)).toFixed(3));
  shapes.push(
    line(markX, 76, markX, 148),
    line(markX - 5, 76, markX + 5, 76),
    line(markX - 5, 148, markX + 5, 148),
  );
  return shapes;
};

const dualPeak: VariantGenerator = ({ geometry: g, details: d }) => {
  const x = g(565, 625),
    y = g(110, 125),
    span = g(255, 285),
    height = g(98, 108);
  const shapes: ArtPrimitive[] = [];
  // Two summits sit inside a shared saddle-shaped perimeter, not two detached
  // contour stickers. The inner nests fit inside the narrowest outer envelope.
  for (let i = 0; i < 4; i++) {
    const scale = 0.8 + i * 0.075;
    shapes.push(
      contour(
        (t) => [
          x + Math.cos(t) * span * scale,
          y + Math.sin(t) * height * scale * (0.65 + 0.35 * Math.cos(t) ** 2),
        ],
        i,
      ),
    );
  }
  const count = Math.floor(d(3, 5));
  for (const direction of [-1, 1]) {
    const center = x + direction * span * 0.38;
    for (let i = 0; i < count; i++) {
      const radius = 15 + i * 11;
      shapes.push(
        contour(
          (t) => [
            center + Math.cos(t) * radius * 1.15,
            y + Math.sin(t) * radius * 0.65,
          ],
          i + 4,
        ),
      );
    }
  }
  return shapes;
};

const elongatedRidge: VariantGenerator = ({ geometry: g, details: d }) => {
  const x = g(570, 620),
    y = g(116, 130),
    width = g(280, 320),
    height = g(63, 80),
    bend = g(22, 38);
  const shapes: ArtPrimitive[] = [];
  const count = Math.floor(d(7, 10));
  for (let i = 0; i < count; i++) {
    const scale = 0.18 + (0.82 * i) / (count - 1);
    shapes.push(
      contour((t) => {
        const u = Math.cos(t) * scale;
        return [
          x + width * u,
          y + height * Math.sin(t) * scale + bend * Math.sin(u * Math.PI),
        ];
      }, i),
    );
  }
  return shapes;
};

const valley: VariantGenerator = ({ geometry: g, details: d }) => {
  const x = g(565, 625),
    y = g(75, 90),
    width = g(250, 290),
    depth = g(42, 55),
    bend = g(0.12, 0.25);
  const shapes: ArtPrimitive[] = [];
  const count = Math.floor(d(7, 10));
  // Open contours follow the same valley floor and bank curvature. Their common
  // domain and ordered vertical offsets keep one continuous terrain section.
  for (let i = 0; i < count; i++) {
    const points: Point[] = [];
    for (let step = 0; step <= 100; step++) {
      const u = step / 50 - 1;
      points.push([
        x + width * u,
        y +
          i * 13 +
          depth * (Math.sqrt(u * u + 0.04) - 0.2) +
          bend * depth * Math.sin(u * Math.PI),
      ]);
    }
    shapes.push({
      ...trace(
        points,
        i === 3 ? "primary" : i % 3 === 0 ? "border-strong" : "border",
      ),
      opacity: i === 3 ? 0.55 : 0.85,
    });
  }
  return shapes;
};

const asymmetricMass: VariantGenerator = ({ geometry: g, details: d }) => {
  const x = g(555, 600),
    y = g(110, 125),
    width = g(230, 260),
    height = g(86, 100),
    phase = g(-0.35, 0.35);
  const shapes: ArtPrimitive[] = [];
  const count = Math.floor(d(7, 10));
  // Scale about a common summit. The pear-shaped envelope shifts mass to one
  // side while retaining nested, non-intersecting level sets.
  for (let i = 0; i < count; i++) {
    const scale = 0.18 + (0.82 * i) / (count - 1);
    shapes.push(
      contour((t) => {
        const r = 1 + 0.27 * Math.cos(t) + 0.08 * Math.sin(3 * t + phase);
        return [
          x + Math.cos(t) * width * scale * r,
          y + Math.sin(t) * height * scale * r,
        ];
      }, i),
    );
  }
  shapes.push(cross(x, y, 3));
  return shapes;
};

const croppedMass: VariantGenerator = ({ geometry: g, details: d }) => {
  const x = g(555, 620),
    y = g(190, 210),
    width = g(285, 330),
    height = g(160, 180),
    phase = g(0, TAU);
  const shapes: ArtPrimitive[] = [];
  const count = Math.floor(d(8, 11));
  for (let i = 0; i < count; i++) {
    const scale = 0.25 + (0.75 * i) / (count - 1);
    shapes.push(
      contour((t) => {
        const r = 1 + 0.08 * Math.sin(3 * t + phase);
        return [
          x + Math.cos(t) * width * scale * r,
          y + Math.sin(t) * height * scale * r,
        ];
      }, i),
    );
  }
  return shapes;
};

export const contours = Object.freeze([
  { name: "single-basin", generate: basin },
  { name: "dual-peak", generate: dualPeak },
  { name: "elongated-ridge", generate: elongatedRidge },
  { name: "valley", generate: valley },
  { name: "asymmetric-mass", generate: asymmetricMass },
  { name: "cropped-mass", generate: croppedMass },
] satisfies ArtVariant[]);
