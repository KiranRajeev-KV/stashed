# Procedural idea artwork · V2

The committed V1 is the compositional baseline. V2 selects one complete curated
composition, then varies parameters owned by that composition. There is no global
layout, density, reflection, crop, secondary-motif, or accent-placement grammar.

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

The original FNV-1a / Mulberry32 implementation and seed encoding are unchanged:

- `family:v2`
- `variant:v2:<family>`
- `geometry:v2:<family>:<variant>`
- `details:v2:<family>:<variant>`
- `accent:v2:<family>:<variant>`

Family and variant arrays have frozen ordering. Preserve these slots, namespace
meanings, and generator math after acceptance; new mappings should deliberately
become V3. This V2 intentionally replaces the previous uncommitted V2; production
V1 ideas receive new deterministic artwork without persisted configuration.

Scene metadata is limited to `version`, `family`, and `variant`, exposed as SVG
data attributes. Only paths, ellipses, and rectangles are used. Loops have fixed
bounds; contours have 128 samples per closed curve and at most 12 curves. There
are no dependencies, filters, noise layers, network calls, or runtime entropy.
