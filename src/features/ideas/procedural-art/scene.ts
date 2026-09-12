export type ArtTone =
  | "surface-muted"
  | "border"
  | "border-strong"
  | "muted-foreground"
  | "primary"
  | "accent";

type Paint = {
  stroke?: ArtTone;
  fill?: ArtTone;
  opacity?: number;
  strokeWidth?: number;
  dash?: string;
};

export type ArtPrimitive = Paint &
  (
    | { kind: "path"; d: string }
    | {
        kind: "ellipse";
        cx: number;
        cy: number;
        rx: number;
        ry: number;
        rotation?: number;
      }
    | { kind: "rect"; x: number; y: number; width: number; height: number }
  );

export type ArtScene = {
  version: "v2";
  family: "drafting" | "contours" | "editorial" | "orbital";
  variant: string;
  primitives: readonly ArtPrimitive[];
};
