import {
  twButtonBase,
  twButtonPrimary,
  twButtonSecondary,
  twButtonGhost,
  twButtonDestructive,
  twButtonIcon,
} from "../../styles/button-styles.js";

const variants = {
  primary: twButtonPrimary,
  secondary: twButtonSecondary,
  ghost: twButtonGhost,
  destructive: twButtonDestructive,
};

export type ButtonStyleOptions = {
  variant?: keyof typeof variants;
  size?: "default" | "icon";
  className?: string;
};

/** Use on router Links and anchors to preserve native navigation semantics. */
export function buttonStyles({
  variant = "secondary",
  size = "default",
  className = "",
}: ButtonStyleOptions = {}) {
  return `${twButtonBase} ${variants[variant]} ${size === "icon" ? twButtonIcon : ""} ${className}`;
}
