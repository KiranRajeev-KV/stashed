import type { ReactNode } from "react";

/** Keep mounted so assistive technology can announce text changes. */
export function ActionFeedback({
  state = "idle",
  children,
  className = "",
}: {
  state?: "idle" | "pending" | "success" | "error";
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`text-caption leading-relaxed wrap-anywhere ${className}`}>
      <div role="status" aria-atomic="true" className="text-muted-foreground">
        {state !== "error" ? children : null}
      </div>
      <div role="alert" aria-atomic="true" className="text-danger">
        {state === "error" ? children : null}
      </div>
    </div>
  );
}
