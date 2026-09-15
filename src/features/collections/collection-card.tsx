import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import type { CollectionListItem } from "../../api/collections.js";
import {
  twCollectionCard,
  twCollectionCardBody,
  twCollectionIconTile,
  twCollectionMeta,
} from "../../styles/collection-styles.js";
import { VisibilityIcon } from "../ideas/visibility-icon.js";
import { CollectionIcon } from "./collection-icon.js";
import { CollectionCollaboratorAvatars } from "./collaborator-avatars.js";

export function CollectionCard({
  collection,
}: {
  collection: CollectionListItem;
}) {
  return (
    <article className={twCollectionCard}>
      <div className={twCollectionCardBody}>
        <div className="flex min-w-0 items-start gap-3.5">
          <span className={twCollectionIconTile}>
            <CollectionIcon icon={collection.icon} className="size-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="min-w-0 font-display text-card-title font-normal text-pretty">
              <Link
                to="/collections/$collectionId"
                params={{ collectionId: collection.id }}
                className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
              >
                {collection.name}
              </Link>
            </h2>
            <div className={`${twCollectionMeta} mt-1.5`}>
              <span className="inline-flex items-center gap-1.5 capitalize">
                <VisibilityIcon
                  visibility={collection.visibility}
                  className="size-3.5"
                />
                {collection.visibility.toLowerCase()}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {collection.visibleIdeaCount}{" "}
                {collection.visibleIdeaCount === 1 ? "idea" : "ideas"}
              </span>
            </div>
          </div>
        </div>
        <p className="mt-4 line-clamp-3 text-ui leading-description text-muted-foreground">
          {collection.description ||
            "No description has been added to this collection."}
        </p>
        <footer className="mt-auto flex min-w-0 items-center justify-between gap-3 pt-5 text-caption text-muted-foreground">
          <CollectionCollaboratorAvatars
            owner={collection.owner}
            editors={collection.editors}
          />
          <ArrowRight
            className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            aria-hidden="true"
          />
        </footer>
      </div>
    </article>
  );
}
