import type { SearchResult } from "../../api/search.js";
import { IdeaCard } from "../ideas/idea-card.js";
import { HighlightedText } from "./highlighted-excerpt.js";

type SearchResultCardProps = {
  result: SearchResult;
};

export function SearchResultCard({ result }: SearchResultCardProps) {
  return (
    <IdeaCard
      idea={result}
      title={<HighlightedText text={result.highlightedTitle} />}
      excerpt={<HighlightedText text={result.excerpt} />}
    />
  );
}
