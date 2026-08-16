import type { ReactNode } from "react";

const HIGHLIGHT_START = "[[[HIGHLIGHT_START]]]";
const HIGHLIGHT_END = "[[[HIGHLIGHT_END]]]";

type HighlightedTextProps = {
  text: string;
};

function parseHighlightedText(text: string) {
  const parts: ReactNode[] = [];
  let cursor = 0;
  let matchIndex = 0;

  while (cursor < text.length) {
    const start = text.indexOf(HIGHLIGHT_START, cursor);

    if (start === -1) {
      parts.push(text.slice(cursor));
      break;
    }

    const matchStart = start + HIGHLIGHT_START.length;
    const end = text.indexOf(HIGHLIGHT_END, matchStart);

    if (end === -1) {
      parts.push(text.slice(cursor));
      break;
    }

    if (start > cursor) {
      parts.push(text.slice(cursor, start));
    }

    parts.push(
      <mark key={`match-${matchIndex}`} className="search-result-highlight">
        {text.slice(matchStart, end)}
      </mark>,
    );
    matchIndex += 1;
    cursor = end + HIGHLIGHT_END.length;
  }

  return parts;
}

export function HighlightedText({ text }: HighlightedTextProps) {
  return <>{parseHighlightedText(text)}</>;
}
