import {
  arc,
  cross,
  dot,
  ellipse,
  ink,
  line,
  measure,
  path,
  point,
  rect,
  trace,
  type ArtVariant,
  type VariantGenerator,
} from "../primitives.js";
import type { ArtPrimitive } from "../scene.js";

const constructionCircle: VariantGenerator = ({
  geometry: g,
  details: d,
  accent: a,
}) => {
  const x = g(535, 590),
    y = g(112, 125),
    r = g(70, 85);
  const left = x - r * 2.6,
    right = x + r * 3;
  const shapes: ArtPrimitive[] = [
    rect(x - r, y - r, r * 2, r * 2, "surface-muted"),
  ];
  for (let i = -2; i <= 3; i++)
    shapes.push(line(x + (i * r) / 2, y - r - 12, x + (i * r) / 2, y + r + 12));
  for (let i = -2; i <= 2; i++)
    shapes.push(line(x - r * 1.5, y + (i * r) / 2, right, y + (i * r) / 2));
  shapes.push(
    ellipse(x, y, r),
    ink(arc(x, y, r, r, -Math.PI / 2, 0)),
    line(left, y, right, y, "border-strong"),
    cross(x, y),
    ...measure(x - r, y + r + 18, r * 2),
  );
  if (d() > 0.4) shapes.push(line(x + r, y - r, x + r, y + r + 22));
  shapes.push(dot(x + r, y + (a() > 0.5 ? 0 : -r)));
  return shapes;
};

const radialStudy: VariantGenerator = ({
  geometry: g,
  details: d,
  accent: a,
}) => {
  const x = g(555, 620),
    y = g(166, 180),
    rx = g(225, 260),
    ry = g(125, 145);
  const start = -Math.PI + 0.13,
    end = -0.13;
  const shapes: ArtPrimitive[] = [
    arc(x, y, rx, ry, start, end),
    arc(x, y, rx * 0.75, ry * 0.75, start, end),
    line(x - rx - 18, y, x + rx + 18, y),
    cross(x, y),
  ];
  const count = Math.floor(d(7, 10));
  for (let i = 0; i < count; i++) {
    const angle = start + ((end - start) * i) / (count - 1);
    const px = x + rx * Math.cos(angle),
      py = y + ry * Math.sin(angle);
    shapes.push(
      line(x, y, px, py),
      line(
        px,
        py,
        x + (rx + 8) * Math.cos(angle),
        y + (ry + 6) * Math.sin(angle),
        "border-strong",
      ),
    );
  }
  const angle = a(-2.4, -0.7),
    px = x + rx * Math.cos(angle),
    py = y + ry * Math.sin(angle);
  shapes.push(ink(line(x, y, px, py)), dot(px, py));
  return shapes;
};

const architecturalSection: VariantGenerator = ({
  geometry: g,
  details: d,
  accent: a,
}) => {
  const x = g(345, 385),
    width = g(440, 500),
    base = g(185, 195),
    height = g(125, 145);
  const bay = width / 5,
    roof = base - height;
  const shapes: ArtPrimitive[] = [
    rect(x + bay * 1.5, roof, bay * 2, height, "surface-muted"),
    path(
      `M ${point([x, base])} v -${height * 0.6} h ${bay * 1.5} V ${roof} h ${bay * 2} v ${height * 0.38} h ${bay * 1.5} V ${base}`,
      "border-strong",
    ),
    ink(line(x - 20, base, x + width + 20, base)),
    ...measure(x, base + 22, width),
  ];
  for (let i = 1; i < 5; i++)
    shapes.push(
      line(
        x + i * bay,
        base,
        x + i * bay,
        roof + (i === 1 || i === 4 ? height * 0.4 : 0),
      ),
    );
  const count = Math.floor(d(12, 17));
  for (let i = 0; i < count; i++)
    shapes.push(
      line(
        x + (i * width) / count,
        base,
        x + (i * width) / count - 9,
        base + 10,
      ),
    );
  shapes.push(dot(x + (a() > 0.5 ? 1.5 : 3.5) * bay, roof));
  return shapes;
};

const offsetGrid: VariantGenerator = ({
  geometry: g,
  details: d,
  accent: a,
}) => {
  const x = g(350, 395),
    y = g(55, 70),
    w = g(380, 430),
    h = g(112, 130),
    dx = g(45, 65),
    dy = -25;
  const shapes: ArtPrimitive[] = [
    rect(x, y, w, h, "surface-muted"),
    rect(x, y, w, h),
    rect(x + dx, y + dy, w, h),
  ];
  for (const [px, py] of [
    [x, y],
    [x + w, y],
    [x, y + h],
    [x + w, y + h],
  ])
    shapes.push(line(px, py, px + dx, py + dy));
  const count = Math.floor(d(4, 7));
  for (let i = 1; i < count; i++)
    shapes.push(
      line(x + (w * i) / count, y, x + (w * i) / count, y + h),
      line(
        x + dx,
        y + dy + (h * i) / count,
        x + dx + w,
        y + dy + (h * i) / count,
      ),
    );
  shapes.push(
    ink(line(x, y + h, x + w, y + h)),
    ...measure(x, y + h + 22, w),
    dot(x + (a() > 0.5 ? w : 0), y + h),
  );
  return shapes;
};

const measurementDiagram: VariantGenerator = ({
  geometry: g,
  details: d,
  accent: a,
}) => {
  const x = g(555, 610),
    y = g(105, 120),
    half = g(160, 185),
    r = g(53, 65);
  const left = x - half,
    right = x + half;
  const outline = `M ${point([left, y - r])} H ${right} A ${r} ${r} 0 0 1 ${right} ${y + r} H ${left} A ${r} ${r} 0 0 1 ${left} ${y - r} Z`;
  const shapes: ArtPrimitive[] = [
    path(outline, "border-strong"),
    line(left - r - 18, y, right + r + 18, y),
    ellipse(left, y, r * 0.48),
    ellipse(right, y, r * 0.48),
    cross(left, y),
    cross(right, y),
    ...measure(left - r, y + r + 28, half * 2 + r * 2),
    line(left - r, y, left - r, y + r + 32),
    line(right + r, y, right + r, y + r + 32),
    ink(line(left, y - r, right, y - r)),
  ];
  if (d() > 0.35) shapes.push(...measure(left, y + r + 12, half * 2));
  shapes.push(dot(a() > 0.5 ? left : right, y));
  return shapes;
};

const technicalProjection: VariantGenerator = ({
  geometry: g,
  details: d,
  accent: a,
}) => {
  const x = g(355, 395),
    y = g(90, 105),
    w = g(350, 390),
    h = g(90, 105),
    dx = g(70, 95),
    dy = -55;
  const top = [
    [x, y],
    [x + dx, y + dy],
    [x + w + dx, y + dy],
    [x + w, y],
  ] as const;
  const shapes: ArtPrimitive[] = [
    { ...trace(top, "border", true), fill: "surface-muted" },
    rect(x, y, w, h),
    trace(
      [
        [x + w, y + h],
        [x + w + dx, y + h + dy],
        [x + w + dx, y + dy],
      ],
      "border-strong",
    ),
    ink(line(x, y, x + w, y)),
    ...measure(x, y + h + 20, w),
  ];
  const fraction = d(0.35, 0.6),
    px = x + w * fraction;
  shapes.push(
    line(px, y + h, px, y),
    line(px, y, px + dx, y + dy),
    dot(a() > 0.5 ? px : x + w, y),
  );
  return shapes;
};

// Frozen curated compositions: preserve slot order for V2.
export const drafting = Object.freeze([
  { name: "construction-circle", generate: constructionCircle },
  { name: "radial-study", generate: radialStudy },
  { name: "architectural-section", generate: architecturalSection },
  { name: "offset-grid", generate: offsetGrid },
  { name: "measurement-diagram", generate: measurementDiagram },
  { name: "technical-projection", generate: technicalProjection },
] satisfies ArtVariant[]);
