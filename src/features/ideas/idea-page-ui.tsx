import { twIdeaTagLink } from "../../styles/idea-page-styles.js";
import { Link } from "@tanstack/react-router";
import { Hash } from "lucide-react";

export function IdeaTagLink({ tag }: { tag: { id: string; name: string } }) {
  return (
    <Link to="/ideas" search={{ tag: tag.id }} className={twIdeaTagLink}>
      <Hash size={12} aria-hidden="true" />
      <span>{tag.name}</span>
    </Link>
  );
}
