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

const constructionCircle: VariantGenerator = ({ geometry: g, details: d }) => {
  // V1's exact composition and parameter ranges, using this slot's V2 streams.
  // Round the anchors before deriving geometry, as the original generator did.
  const x = Number(g(480, 610).toFixed(3)),
    y = Number(g(95, 145).toFixed(3)),
    radius = Number(g(48, 72).toFixed(3));
  const shapes: ArtPrimitive[] = [];
  for (let i = 0; i < 6; i++)
    shapes.push(line(x - 110 + i * 40, 34, x - 110 + i * 40, 206));
  for (let i = 0; i < 4; i++)
    shapes.push(line(x - 130, 50 + i * 40, x + 130, 50 + i * 40));
  shapes.push(
    {
      ...rect(x - radius, y - radius, radius * 2, radius * 2, "surface-muted"),
      opacity: 0.7,
    },
    ellipse(x, y, radius),
    {
      ...path(
        `M ${x} ${y - radius} A ${radius} ${radius} 0 0 1 ${x + radius} ${y} H ${x + 175}`,
        "primary",
      ),
      opacity: 0.65,
      strokeWidth: 1.5,
    },
    line(x - radius - 25, y, x + radius + 25, y),
    line(x, y - radius - 20, x, y + radius + 20),
    cross(x, y, 5),
    line(x - radius, 218, x + radius, 218, "border-strong"),
    line(x - radius, 214, x - radius, 222, "border-strong"),
    line(x + radius, 214, x + radius, 222, "border-strong"),
    { ...rect(x + 171, y - 3, 6, 6, "accent"), opacity: 0.65 },
  );
  const offset = Number(d(230, 290).toFixed(3));
  shapes.push(cross(x + offset, 64, 5), line(x + offset, 82, x + offset, 156));
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
  // A short angular interval belongs to the focal ray, rather than another fan.
  shapes.unshift({
    ...path(
      `M ${point([x, y])} L ${point([x + rx * 0.75 * Math.cos(angle - 0.22), y + ry * 0.75 * Math.sin(angle - 0.22)])} A ${rx * 0.75} ${ry * 0.75} 0 0 1 ${point([x + rx * 0.75 * Math.cos(angle), y + ry * 0.75 * Math.sin(angle)])} Z`,
    ),
    fill: "surface-muted",
    stroke: undefined,
    opacity: 0.7,
  });
  shapes.push(
    ink(arc(x, y, rx * 0.75, ry * 0.75, angle - 0.22, angle)),
    ink(line(x, y, px, py)),
    dot(px, py),
  );
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
    top = base - height,
    cut = x + bay * 2.8,
    radius = height * 0.36,
    axis = top + height * 0.5;
  // A curved return interrupts the sectional rhythm. Its two tangencies define
  // unequal ledges, avoiding a roofline or the symmetry of an arched doorway.
  const shapes: ArtPrimitive[] = [
    line(x - 20, top, x + width + 20, top),
    line(x - 20, axis, x + width + 20, axis),
    {
      ...rect(x + bay, top, cut - radius - x - bay, height, "surface-muted"),
      opacity: 0.7,
    },
    path(
      `M ${point([x, top])} V ${base} H ${cut} V ${axis + radius} A ${radius} ${radius} 0 0 1 ${cut} ${axis - radius} H ${x + width} V ${base}`,
      "border-strong",
    ),
    ink(
      path(
        `M ${point([cut, axis + radius])} A ${radius} ${radius} 0 0 1 ${cut} ${axis - radius} h ${bay * 0.8}`,
      ),
    ),
    { ...line(cut, top - 12, cut, base + 8), dash: "3 6" },
    cross(cut, axis),
    ...measure(x, base + 22, width),
  ];
  for (let i = 1; i < 5; i++)
    // The cut interrupts the full-height bays; the right ledge has short returns.
    if (x + i * bay < cut - radius)
      shapes.push(line(x + i * bay, top - 8, x + i * bay, base + 8));
    else if (x + i * bay > cut)
      shapes.push(line(x + i * bay, top - 8, x + i * bay, axis - radius + 12));
  const count = Math.floor(d(12, 17));
  for (let i = 0; i < count; i++) {
    const px = x + (i * width) / count;
    if (px < cut) shapes.push(line(px, base, px - 9, base + 10));
  }
  shapes.push(a() > 0.5 ? dot(cut - radius, axis) : dot(cut, axis - radius));
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
  const seam = x + w * 0.58,
    axis = y + h * 0.52,
    radius = h * 0.44;
  const shapes: ArtPrimitive[] = [
    // Only the overlapping region carries tone, revealing the displacement.
    { ...rect(x + dx, y, w - dx, h + dy, "surface-muted"), opacity: 0.7 },
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
  const projectedTip = a() > 0.5 ? 1 : 0;
  shapes.push(
    ellipse(seam, axis, radius, radius, "border"),
    line(x - 18, axis, x + w + dx + 18, axis),
    line(seam, y - 12, seam, y + h + 10),
    // The quarter turn ends on the same axis as its projected continuation.
    ink(
      path(
        `M ${point([seam, axis - radius])} A ${radius} ${radius} 0 0 1 ${seam + radius} ${axis} H ${x + w} l ${dx} ${dy}`,
      ),
    ),
    cross(seam, axis),
    ...measure(x, y + h + 22, w),
    dot(x + w + dx * projectedTip, axis + dy * projectedTip),
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
    right = x + half,
    studyRadius = r * 1.16;
  const outline = `M ${point([left, y - r])} H ${right} A ${r} ${r} 0 0 1 ${right} ${y + r} H ${left} A ${r} ${r} 0 0 1 ${left} ${y - r} Z`;
  const shapes: ArtPrimitive[] = [
    // Retain the measured capsule; one end is a bore, the other an overlapping
    // radius study. Both constructions share the capsule's centers and axis.
    {
      ...rect(left - r * 0.7, y - r * 0.7, r * 1.4, r * 1.4, "surface-muted"),
      opacity: 0.7,
    },
    path(outline, "border-strong"),
    line(left - r - 18, y, right + studyRadius + 18, y),
    ellipse(left, y, r * 0.48),
    ellipse(right, y, studyRadius, studyRadius, "border"),
    line(right, y - studyRadius - 12, right, y + studyRadius + 12),
    cross(left, y),
    cross(right, y),
    ...measure(left - r, y + r + 28, half * 2 + r * 2),
    line(left - r, y, left - r, y + r + 32),
    line(right + r, y, right + r, y + r + 32),
    ink(
      path(
        `M ${point([left, y - r])} H ${right} A ${r} ${r} 0 0 1 ${right + r} ${y}`,
      ),
    ),
  ];
  if (d() > 0.35) shapes.push(...measure(left, y + r + 12, half * 2));
  const angle = a(-Math.PI / 2, 0),
    px = right + r * Math.cos(angle),
    py = y + r * Math.sin(angle);
  shapes.push(line(right, y, px, py), dot(px, py));
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
  const cx = x + w * d(0.48, 0.6),
    cy = y + h * 0.5,
    rx = w * 0.22,
    ry = h * 0.64;
  // A curved section projects along the box's own displacement. Tangencies,
  // hidden edges, and the highlighted generatrix all use this one model.
  const shapes: ArtPrimitive[] = [
    { ...trace(top, "border", true), fill: "surface-muted", opacity: 0.7 },
    {
      ...arc(cx + dx, cy + dy, rx, ry, Math.PI, Math.PI * 2),
      stroke: "border",
      dash: "3 6",
    },
    { ...line(x + dx, y + dy, x + dx, y + h + dy), dash: "3 6" },
    { ...line(x + dx, y + h + dy, x + w + dx, y + h + dy), dash: "3 6" },
    trace([
      [x, y],
      [x, y + h],
      [x + w, y + h],
      [x + w, y],
    ]),
    trace(
      [
        [x + w, y + h],
        [x + w + dx, y + h + dy],
        [x + w + dx, y + dy],
      ],
      "border-strong",
    ),
    ellipse(cx, cy, rx, ry),
    line(cx, cy + ry, cx + dx, cy + ry + dy),
    line(x - 18, cy, x + w + 18, cy),
    line(cx, cy - ry - 12, cx, cy + ry + 10),
    { ...line(cx, cy, cx + dx, cy + dy), dash: "3 6" },
    cross(cx, cy),
    cross(cx + dx, cy + dy),
    ink(
      path(
        `M ${point([cx + rx, cy])} A ${rx} ${ry} 0 0 0 ${cx} ${cy - ry} l ${dx} ${dy}`,
      ),
    ),
    ...measure(x, y + h + 20, w),
  ];
  const t = a(0.35, 0.8);
  shapes.push(dot(cx + dx * t, cy - ry + dy * t));
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
