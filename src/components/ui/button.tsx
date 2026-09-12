import type { ComponentProps } from "react";
import { LoaderCircle } from "lucide-react";
import { buttonStyles, type ButtonStyleOptions } from "./button-variants.js";

type ButtonProps = ComponentProps<"button"> &
  ButtonStyleOptions & {
    loading?: boolean;
    loadingLabel?: string;
  };

/** React 19 forwards ref through props, including Radix asChild triggers. */
export function Button({
  variant,
  size,
  className,
  loading = false,
  loadingLabel,
  disabled,
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonStyles({ variant, size, className })}
    >
      {loading && (
        <LoaderCircle
          aria-hidden="true"
          size={16}
          className="animate-spin motion-reduce:animate-none"
        />
      )}
      {loading ? (loadingLabel ?? children) : children}
    </button>
  );
}
