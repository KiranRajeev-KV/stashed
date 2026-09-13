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

const intersection: VariantGenerator = ({ geometry: g, details: d }) => {
  // Preserve V1's parameter ranges, layering, and fixed accent placement.
  // Only the source streams change to this variant's existing V2 namespaces.
  const x = Number(g(470, 580).toFixed(3)),
    y = Number(g(90, 120).toFixed(3)),
    radius = Number(g(50, 72).toFixed(3)),
    width = Number(g(95, 145).toFixed(3));
  const shapes: ArtPrimitive[] = [
    { ...ellipse(x, y, radius), fill: "surface-muted", stroke: undefined },
    rect(x + 24, y - 30, width, 100),
    {
      ...path(
        `M ${x - radius} ${y} A ${radius} ${radius} 0 0 1 ${x + radius} ${y}`,
        "primary",
      ),
      opacity: 0.6,
      strokeWidth: 1.5,
    },
    { ...rect(x + width + 50, y + 38, 50, 32, "primary"), opacity: 0.16 },
    line(x - 175, y + 70, x + 280, y + 70, "border-strong"),
    line(x + 24, 30, x + 24, 212),
    { ...rect(x - 130, y + 64, 20, 3, "accent"), opacity: 0.7 },
  ];
  const count = Math.floor(d(5, 9));
  for (let i = 0; i < count; i++)
    shapes.push(line(x + width + 50 + i * 7, 50, x + width + 50 + i * 7, 70));
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
  const axis = y - r * 0.2;
  // The off-center rule and small overlapping band bridge the split. The
  // opposing regions retain their common upper and lower tangencies.
  const shapes: ArtPrimitive[] = [
    rect(x - half, y - r, half - gap, r * 2, "surface-muted"),
    rect(x - half, y - r, half - gap, r * 2),
    path(
      `M ${point([x + gap, y - r])} A ${half - gap} ${r} 0 0 1 ${x + gap} ${y + r} Z`,
      "border-strong",
    ),
    line(x - half, y - r, x + gap, y - r),
    line(x - half, y + r, x + gap, y + r),
    { ...rect(x - gap - 18, axis, gap * 2 + 42, 22, "primary"), opacity: 0.12 },
    line(x - half - 18, axis, x + half + 18, axis),
    ink(
      path(
        `M ${point([x - gap, y + r])} V ${y - r} M ${point([x - gap, axis])} H ${x + gap + 24}`,
      ),
    ),
  ];
  const count = Math.floor(d(4, 7));
  for (let i = 0; i < count; i++)
    shapes.push(
      line(x - gap - 18 - i * 8, y - r, x - gap - 18 - i * 8, y - r + 16),
    );
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
      opacity: 0.7,
    },
    rect(x + inset, top, w - inset * 2, h),
    ink(line(...left, ...right)),
    line(x - 20, top + h, x + w + 20, top + h, "border-strong"),
    line(x + inset, top - 12, x + inset, top + h + 18),
    line(x + inset, top + h, x + w, top + (h * inset) / w),
  ];
  // Short rulings bridge the two parallel diagonals near the frame's right
  // edge. Their endpoints follow the slope, rather than a detached tick band.
  const count = Math.floor(d(4, 7));
  for (let i = 0; i < count; i++) {
    const px = x + w - inset - i * 8,
      py = top + h * (1 - (px - x) / w);
    shapes.push(line(px, py, px, py + (h * inset) / w));
  }
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
  const overlap = split * 0.22,
    lift = h * 0.14,
    ledge = base - h * 0.63;
  // The outlined block cuts into the solid one, then lifts off the common
  // baseline. The two close vertical rules expose the overlap's width.
  const shapes: ArtPrimitive[] = [
    rect(x, base - h, split, h, "surface-muted"),
    rect(x + split - overlap, ledge, w - split + overlap, h * 0.63 - lift),
    line(x - 18, base, x + w + 18, base, "border-strong"),
    ink(line(x, base, x + split, base)),
    line(x + split, base - h - 10, x + split, base + 10),
    line(x + split - overlap, ledge - 16, x + split - overlap, base + 10),
    line(x, base - h, x + split, base - h, "border-strong"),
  ];
  const count = Math.floor(d(4, 7));
  for (let i = 0; i < count; i++)
    shapes.push(line(x + split + i * 9, ledge, x + split + i * 9, ledge + 22));
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
    // A single inset return thickens the left boundary without entering the
    // aperture. Keep the center and the opposing curved boundary untouched.
    path(
      `M ${point([x - gap - 24, y - ry + 12])} H ${x - rx + 40} V ${y + ry - 12} H ${x - gap - 24}`,
    ),
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
  const center = x + offset,
    top = y - r * 0.55,
    bottom = y + r * 0.82,
    // The frame's top edge intersects the circle, defining the interior chord.
    chord = center - Math.sqrt(r * r - (top - y) ** 2);
  const shapes: ArtPrimitive[] = [
    { ...ellipse(center, y, r), fill: "surface-muted", stroke: undefined },
    // Draw the frame over the circle so the overlap remains legible. Its
    // off-center edges cut the disc instead of sharing its outer tangencies.
    rect(x - w, top, w + offset, bottom - top),
    ellipse(center, y, r),
    { ...rect(chord, top, center - chord, 18, "primary"), opacity: 0.12 },
    ink(arc(center, y, r, r, Math.PI / 2, Math.PI * 1.5)),
    line(x - w - 18, y, center + r + 15, y),
    line(chord, top - 18, chord, bottom + 18),
    line(x - w - 18, bottom + 12, center, bottom + 12, "border-strong"),
  ];
  const count = Math.floor(d(4, 7));
  for (let i = 0; i < count; i++)
    shapes.push(line(chord - i * 8, top, chord - i * 8, top - 14));
  shapes.push(dot(center, y + (a() > 0.5 ? r : -r)));
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
