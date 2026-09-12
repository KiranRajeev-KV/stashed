import { useMemo } from "react";
import { twIdeaBanner } from "../../../styles/idea-page-styles.js";
import { generateIdeaScene } from "./generate.js";
import type { ArtPrimitive } from "./scene.js";

function Primitive({ primitive }: { primitive: ArtPrimitive }) {
  const paint = {
    fill: primitive.fill ? `var(--${primitive.fill})` : "none",
    stroke: primitive.stroke ? `var(--${primitive.stroke})` : "none",
    strokeWidth: primitive.strokeWidth ?? 1,
    opacity: primitive.opacity,
    strokeDasharray: primitive.dash,
    vectorEffect: "non-scaling-stroke" as const,
  };

  switch (primitive.kind) {
    case "path":
      return <path {...paint} d={primitive.d} />;
    case "rect":
      return (
        <rect
          {...paint}
          x={primitive.x}
          y={primitive.y}
          width={primitive.width}
          height={primitive.height}
        />
      );
    case "ellipse":
      return (
        <ellipse
          {...paint}
          cx={primitive.cx}
          cy={primitive.cy}
          rx={primitive.rx}
          ry={primitive.ry}
          transform={
            primitive.rotation === undefined
              ? undefined
              : `rotate(${primitive.rotation} ${primitive.cx} ${primitive.cy})`
          }
        />
      );
  }
}

export function ProceduralIdeaBanner({ ideaId }: { ideaId: string }) {
  const scene = useMemo(() => generateIdeaScene(ideaId), [ideaId]);

  return (
    <div className={twIdeaBanner} aria-hidden="true">
      <svg
        className="block size-full"
        viewBox="0 0 1200 240"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        focusable="false"
        data-art-version={scene.version}
        data-art-family={scene.family}
      >
        {scene.primitives.map((primitive, index) => (
          <Primitive key={index} primitive={primitive} />
        ))}
      </svg>
    </div>
  );
}
