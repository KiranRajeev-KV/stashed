import { createRandom } from "./random.js";
import type { ArtVariant } from "./primitives.js";
import type { ArtScene } from "./scene.js";
import { drafting } from "./families/drafting.js";
import { contours } from "./families/contours.js";
import { editorial } from "./families/editorial.js";
import { orbital } from "./families/orbital.js";

// These slots and each family's variant order are the V2 compatibility contract.
// Additions/reordering require an intentional V3, not a change to this mapping.
const V2_FAMILIES = Object.freeze([
  "drafting",
  "contours",
  "editorial",
  "orbital",
] as const);
const V2_VARIANTS: Readonly<Record<ArtScene["family"], readonly ArtVariant[]>> =
  Object.freeze({ drafting, contours, editorial, orbital });

export function generateIdeaScene(ideaId: string): ArtScene {
  const family =
    V2_FAMILIES[Math.floor(createRandom(ideaId, "family:v2")() * 4)];
  const variants = V2_VARIANTS[family];
  const variant =
    variants[
      Math.floor(
        createRandom(ideaId, `variant:v2:${family}`)() * variants.length,
      )
    ];
  const namespace = `v2:${family}:${variant.name}`;
  return {
    version: "v2",
    family,
    variant: variant.name,
    primitives: variant.generate({
      geometry: createRandom(ideaId, `geometry:${namespace}`),
      details: createRandom(ideaId, `details:${namespace}`),
      accent: createRandom(ideaId, `accent:${namespace}`),
    }),
  };
}
