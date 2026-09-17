import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import {
  twBreadcrumb,
  twBreadcrumbCurrent,
  twBreadcrumbItem,
  twBreadcrumbLink,
  twBreadcrumbList,
  twBreadcrumbSeparator,
} from "../../styles/navigation-styles.js";

/**
 * Semantic route hierarchy. Keep parent items as canonical links and reserve
 * the final, current item for text so navigation remains predictable.
 */
export function Breadcrumbs({ children }: { children: ReactNode }) {
  return (
    <nav className={twBreadcrumb} aria-label="Breadcrumb">
      <ol className={twBreadcrumbList}>{children}</ol>
    </nav>
  );
}

export function BreadcrumbItem({ children }: { children: ReactNode }) {
  return <li className={twBreadcrumbItem}>{children}</li>;
}

/**
 * Styles a router link supplied by the caller, preserving each router's
 * route-specific type checking instead of widening it at the UI boundary.
 */
export function BreadcrumbLink({ children }: { children: ReactNode }) {
  return <span className={twBreadcrumbLink}>{children}</span>;
}

export function BreadcrumbCurrent({ children }: { children: ReactNode }) {
  const label = typeof children === "string" ? children : undefined;
  return (
    <span className={twBreadcrumbCurrent} aria-current="page" title={label}>
      {children}
    </span>
  );
}

export function BreadcrumbSeparator() {
  return (
    <li className={twBreadcrumbSeparator} aria-hidden="true">
      <ChevronRight size={14} strokeWidth={1.75} />
    </li>
  );
}
