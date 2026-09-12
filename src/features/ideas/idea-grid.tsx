import {
  twArchiveCardGrid,
  twArchiveMasonry,
  twArchiveMasonryItem,
} from "../../styles/archive-styles.js";
import { Children, useLayoutEffect, useRef, type ReactNode } from "react";

/** Natural-height cards with row spans, keeping keyboard and DOM order intact. */
export function IdeaGrid({ children }: { children: ReactNode }) {
  const gridRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid || typeof ResizeObserver === "undefined") return;

    const items = Array.from(grid.children) as HTMLElement[];
    const measure = () => {
      for (const item of items) {
        const card = item.firstElementChild as HTMLElement | null;
        if (card) item.style.gridRowEnd = `span ${card.offsetHeight + 20}`;
      }
      grid.dataset.masonry = "true";
    };

    measure();
    const observer = new ResizeObserver(measure);
    for (const item of items) {
      if (item.firstElementChild) observer.observe(item.firstElementChild);
    }
    return () => observer.disconnect();
  }, [children]);

  return (
    <div className={`${twArchiveCardGrid} ${twArchiveMasonry}`} ref={gridRef}>
      {Children.map(children, (child) => (
        <div className={twArchiveMasonryItem}>{child}</div>
      ))}
    </div>
  );
}
