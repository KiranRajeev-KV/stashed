import type { ReactNode } from "react";

const HIGHLIGHT_START = "[[[HIGHLIGHT_START]]]";
const HIGHLIGHT_END = "[[[HIGHLIGHT_END]]]";

type HighlightedExcerptProps = {
  excerpt: string;
};

function parseHighlightedExcerpt(excerpt: string) {
  const parts: ReactNode[] = [];
  let cursor = 0;
  let matchIndex = 0;

  while (cursor < excerpt.length) {
    const start = excerpt.indexOf(HIGHLIGHT_START, cursor);

    if (start === -1) {
      parts.push(excerpt.slice(cursor));
      break;
    }

    const matchStart = start + HIGHLIGHT_START.length;
    const end = excerpt.indexOf(HIGHLIGHT_END, matchStart);

    if (end === -1) {
      parts.push(excerpt.slice(cursor));
      break;
    }

    if (start > cursor) {
      parts.push(excerpt.slice(cursor, start));
    }

    parts.push(
      <mark key={`match-${matchIndex}`} className="search-result-highlight">
        {excerpt.slice(matchStart, end)}
      </mark>,
    );
    matchIndex += 1;
    cursor = end + HIGHLIGHT_END.length;
  }

  return parts;
}

export function HighlightedExcerpt({ excerpt }: HighlightedExcerptProps) {
  return <>{parseHighlightedExcerpt(excerpt)}</>;
}
