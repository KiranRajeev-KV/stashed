import type { createRandom } from "./random.js";
import type { ArtPrimitive, ArtTone } from "./scene.js";

type Random = ReturnType<typeof createRandom>;
export type Point = readonly [number, number];
export type VariantGenerator = (streams: {
  geometry: Random;
  details: Random;
  accent: Random;
}) => ArtPrimitive[];
export type ArtVariant = {
  readonly name: string;
  readonly generate: VariantGenerator;
};
export const TAU = Math.PI * 2;
const n = (value: number) => Number(value.toFixed(3));
export const point = ([x, y]: Point) => `${n(x)} ${n(y)}`;
export function path(d: string, stroke: ArtTone = "border"): ArtPrimitive {
  return { kind: "path", d, stroke };
}
export function line(
  x: number,
  y: number,
  x2: number,
  y2: number,
  stroke: ArtTone = "border",
): ArtPrimitive {
  return path(`M ${point([x, y])} L ${point([x2, y2])}`, stroke);
}
export function ellipse(
  x: number,
  y: number,
  rx: number,
  ry = rx,
  stroke: ArtTone = "border-strong",
): Extract<ArtPrimitive, { kind: "ellipse" }> {
  return { kind: "ellipse", cx: n(x), cy: n(y), rx: n(rx), ry: n(ry), stroke };
}
export function rect(
  x: number,
  y: number,
  width: number,
  height: number,
  fill?: ArtTone,
): ArtPrimitive {
  return {
    kind: "rect",
    x: n(x),
    y: n(y),
    width: n(width),
    height: n(height),
    fill,
    stroke: fill ? undefined : "border-strong",
  };
}
export function cross(x: number, y: number, size = 4): ArtPrimitive {
  return path(
    `M ${point([x - size, y])} h ${size * 2} M ${point([x, y - size])} v ${size * 2}`,
    "border-strong",
  );
}
export function trace(
  points: readonly Point[],
  stroke: ArtTone = "border",
  closed = false,
): ArtPrimitive {
  return path(
    points.map((p, index) => `${index ? "L" : "M"} ${point(p)}`).join(" ") +
      (closed ? " Z" : ""),
    stroke,
  );
}
export function arc(
  x: number,
  y: number,
  rx: number,
  ry: number,
  start: number,
  end: number,
): ArtPrimitive {
  const from: Point = [x + Math.cos(start) * rx, y + Math.sin(start) * ry];
  const to: Point = [x + Math.cos(end) * rx, y + Math.sin(end) * ry];
  return path(
    `M ${point(from)} A ${n(rx)} ${n(ry)} 0 ${end - start > Math.PI ? 1 : 0} 1 ${point(to)}`,
    "border-strong",
  );
}
export function measure(x: number, y: number, width: number): ArtPrimitive[] {
  return [
    line(x, y, x + width, y),
    line(x, y - 4, x, y + 4, "border-strong"),
    line(x + width, y - 4, x + width, y + 4, "border-strong"),
  ];
}

export function ink(primitive: ArtPrimitive): ArtPrimitive {
  return { ...primitive, stroke: "primary", opacity: 0.6, strokeWidth: 1.25 };
}
export function dot(x: number, y: number): ArtPrimitive {
  return {
    ...ellipse(x, y, 3),
    stroke: undefined,
    fill: "accent",
    opacity: 0.65,
  };
}
