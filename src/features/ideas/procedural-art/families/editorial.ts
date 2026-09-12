import type { ArtPrimitive } from "../scene.js";
import {
  arc,
  dot,
  ellipse,
  ink,
  line,
  path,
  point,
  rect,
  trace,
  type ArtVariant,
  type VariantGenerator,
} from "../primitives.js";

const intersection: VariantGenerator = ({
  geometry: g,
  details: d,
  accent: a,
}) => {
  const x = g(500, 550),
    y = g(110, 123),
    r = g(75, 90),
    w = g(230, 265);
  const baseline = y + r;
  const shapes: ArtPrimitive[] = [
    { ...ellipse(x, y, r), fill: "surface-muted", stroke: undefined },
    rect(x + r * 0.3, y - r * 0.55, w, r * 1.55),
    ink(arc(x, y, r, r, Math.PI, Math.PI * 2)),
    line(x - r - 65, baseline, x + w + r * 0.3 + 25, baseline, "border-strong"),
    line(x + r * 0.3, y - r - 12, x + r * 0.3, baseline + 12),
  ];
  if (d() > 0.4)
    shapes.push(
      rect(x + w + r * 0.3 - 30, baseline - 30, 30, 30, "surface-muted"),
    );
  shapes.push(dot(x + (a() > 0.5 ? r * 0.3 : -r), baseline));
  return shapes;
};

const splitStudy: VariantGenerator = ({
  geometry: g,
  details: d,
  accent: a,
}) => {
  const x = g(565, 615),
    y = g(115, 125),
    half = g(225, 255),
    r = g(78, 90),
    gap = g(12, 20);
  // A shared upper/lower rule binds the rectangle and facing semicircle.
  const shapes: ArtPrimitive[] = [
    rect(x - half, y - r, half - gap, r * 2, "surface-muted"),
    rect(x - half, y - r, half - gap, r * 2),
    path(
      `M ${point([x + gap, y - r])} A ${half - gap} ${r} 0 0 1 ${x + gap} ${y + r} Z`,
      "border-strong",
    ),
    line(x - half, y - r, x + gap, y - r),
    line(x - half, y + r, x + gap, y + r),
    ink(line(x - gap, y - r, x - gap, y + r)),
  ];
  if (d() > 0.5) shapes.push(line(x - half, y, x - gap, y));
  shapes.push(dot(x - gap, y + (a() > 0.5 ? r : -r)));
  return shapes;
};

const diagonalStudy: VariantGenerator = ({
  geometry: g,
  details: d,
  accent: a,
}) => {
  const x = g(355, 390),
    top = g(42, 55),
    w = g(440, 485),
    h = g(130, 145),
    inset = g(65, 95);
  const left = [x, top + h] as const,
    right = [x + w, top] as const;
  const shapes: ArtPrimitive[] = [
    {
      ...trace(
        [left, [x + inset, top], right, [x + w - inset, top + h]],
        "border",
        true,
      ),
      fill: "surface-muted",
    },
    rect(x + inset, top, w - inset * 2, h),
    ink(line(...left, ...right)),
    line(x - 20, top + h, x + w, top + h, "border-strong"),
  ];
  // Parallel inset follows the same diagonal, not a separately rotated object.
  if (d() > 0.35)
    shapes.push(line(x + inset, top + h, x + w, top + (h * inset) / w));
  const t = a(0.4, 0.65);
  shapes.push(dot(x + w * t, top + h * (1 - t)));
  return shapes;
};

const asymmetricBlocks: VariantGenerator = ({
  geometry: g,
  details: d,
  accent: a,
}) => {
  const x = g(355, 390),
    base = g(195, 207),
    w = g(440, 485),
    h = g(135, 155),
    split = w * g(0.42, 0.5);
  const shapes: ArtPrimitive[] = [
    rect(x, base - h, split, h, "surface-muted"),
    rect(x + split, base - h * 0.63, w - split, h * 0.63),
    ink(line(x, base, x + w, base)),
    line(x + split, base - h - 10, x + split, base + 10),
    line(x, base - h, x + split, base - h, "border-strong"),
  ];
  const count = Math.floor(d(4, 7));
  for (let i = 0; i < count; i++)
    shapes.push(
      line(
        x + split + i * 9,
        base - h * 0.63,
        x + split + i * 9,
        base - h * 0.63 + 22,
      ),
    );
  shapes.push(dot(x + split, base - (a() > 0.5 ? h * 0.63 : 0)));
  return shapes;
};

const centralVoid: VariantGenerator = ({
  geometry: g,
  details: d,
  accent: a,
}) => {
  const x = g(575, 620),
    y = g(116, 125),
    rx = g(235, 260),
    ry = g(82, 94),
    gap = g(80, 100);
  // Two brackets define one aperture. Common tangents make the empty center the
  // subject, with no detached marks elsewhere on the canvas.
  const shapes: ArtPrimitive[] = [
    path(
      `M ${point([x - gap, y - ry])} H ${x - rx} V ${y + ry} H ${x - gap}`,
      "border-strong",
    ),
    path(
      `M ${point([x + gap, y - ry])} H ${x + rx} V ${y + ry} H ${x + gap}`,
      "border-strong",
    ),
    rect(x - rx, y - ry, 28, ry * 2, "surface-muted"),
    line(x - gap, y - ry, x + gap, y - ry),
    line(x - gap, y + ry, x + gap, y + ry),
    ink(arc(x, y, gap, ry, -Math.PI / 2, Math.PI / 2)),
  ];
  if (d() > 0.4) shapes.push(line(x - rx, y, x - gap, y));
  shapes.push(dot(x + (a() > 0.5 ? gap : -gap), y + ry));
  return shapes;
};

const overlappingStudy: VariantGenerator = ({
  geometry: g,
  details: d,
  accent: a,
}) => {
  const x = g(550, 600),
    y = g(115, 128),
    r = g(78, 88),
    w = g(225, 255),
    offset = g(85, 105);
  const shapes: ArtPrimitive[] = [
    rect(x - w, y - r, w + offset, r * 2),
    { ...ellipse(x + offset, y, r), fill: "surface-muted", stroke: undefined },
    ellipse(x + offset, y, r),
    ink(arc(x + offset, y, r, r, Math.PI / 2, Math.PI * 1.5)),
    line(x - w, y, x + offset + r + 15, y),
    line(x, y - r, x, y + r),
  ];
  if (d() > 0.45) shapes.push(line(x - w, y + r + 12, x + offset, y + r + 12));
  shapes.push(dot(x + offset, y + (a() > 0.5 ? r : -r)));
  return shapes;
};

export const editorial = Object.freeze([
  { name: "circle-rectangle", generate: intersection },
  { name: "split-study", generate: splitStudy },
  { name: "diagonal-study", generate: diagonalStudy },
  { name: "asymmetric-blocks", generate: asymmetricBlocks },
  { name: "central-void", generate: centralVoid },
  { name: "overlapping-study", generate: overlappingStudy },
] satisfies ArtVariant[]);
