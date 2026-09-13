# Procedural idea artwork · V2

V2 selects one complete curated composition, then varies parameters owned by that
composition: `idea.id → family → variant → geometry/details → scene primitives`.

`generateIdeaScene(idea.id)` selects a family and variant. Four family modules each
contain six named generators. `primitives.ts` only provides low-level SVG geometry
and shared generator types; the React component only renders the resulting scene.

| Family    | Curated variants                                                                                                 |
| --------- | ---------------------------------------------------------------------------------------------------------------- |
| Drafting  | Construction circle, radial study, architectural section, offset grid, measurement diagram, technical projection |
| Contours  | Single basin, dual peak, elongated ridge, valley, asymmetric mass, cropped mass                                  |
| Editorial | Circle/rectangle, split study, diagonal study, asymmetric blocks, central void, overlapping study                |
| Orbital   | Concentric system, eccentric orbit, dual focus, sweeping trajectory, radial diagram, intersecting planes         |

Every variant owns its anchors, dimensions, repetition, and annotation positions.
Measurements reference edges; orbit nodes lie on their trajectories; terrain rings
share a deformation model. Accents are limited to one small structural point;
contours use none. Most compositions span about 420–650 of the 1200 SVG units.
The same geometry is cropped on phones and recolored by existing semantic tokens.

Each family's first slot restores its original V1 reference composition from
commit `6a19079916fbf52475dd9d4bf217244881f1873a`: `construction-circle`,
`single-basin`, `circle-rectangle`, and `concentric-system`. They preserve V1's
parameter ranges, proportions, layering, stroke hierarchy, and registration marks,
but use V2 seeds. The orbital slot retains its stable name even though the restored
composition contains intersecting rotated ellipses and a quadratic sweep.

The original FNV-1a / Mulberry32 implementation and seed encoding are unchanged:

- `family:v2`
- `variant:v2:<family>`
- `geometry:v2:<family>:<variant>`
- `details:v2:<family>:<variant>`
- `accent:v2:<family>:<variant>`

The family order is `drafting`, `contours`, `editorial`, `orbital`; variant order
is shown in the table. Both are frozen. After V2 acceptance, do not append, remove,
or reorder slots, rename variants, change namespace meanings, or casually alter
generator math, RNG constants, seed encoding, or geometry helpers. These all affect
existing artwork. Substantial redesigns and new mappings require an intentional
V3. V2 replaces V1 artwork without database persistence or per-idea configuration.

Scene metadata is exposed as `data-art-version`, `data-art-family`, and
`data-art-variant`. The generic React renderer uses inline SVG with a fixed
`1200 × 240` viewBox, `xMidYMid slice`, non-scaling strokes, and decorative
accessibility (`aria-hidden`, `focusable="false"`). Theme changes only recolor
semantic tokens; screen size only changes cropping. Neither regenerates geometry.

Only paths, ellipses, and rectangles are used, with at most 26 primitives per
scene. Closed contours use 96 or 128 samples; open valley curves use 101 points.
The subsystem adds no dependencies, runtime entropy, network calls, animation,
filters, gradients, or noise layers.
