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
        <div className="flex min-w-0 items-center justify-between gap-2 sm:gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className={`${twCollectionIconTile} shrink-0 [&]:size-8`}>
              <CollectionIcon icon={collection.icon} className="size-4" />
            </span>
            <div className={twCollectionMeta}>
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
          <div className="pointer-events-none flex shrink-0 items-center gap-2 sm:gap-3">
            <CollectionCollaboratorAvatars
              owner={collection.owner}
              editors={collection.editors}
              className="pointer-events-auto"
            />
            <ArrowRight
              className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              aria-hidden="true"
            />
          </div>
        </div>
        <div className="mt-3 min-w-0">
          <h2 className="font-display text-card-title font-normal text-pretty wrap-anywhere">
            <Link
              to="/collections/$collectionId"
              params={{ collectionId: collection.id }}
              className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
            >
              {collection.name}
            </Link>
          </h2>
          <p className="mt-1.5 line-clamp-2 text-ui leading-description text-muted-foreground">
            {collection.description?.trim() ||
              "No description has been added to this collection."}
          </p>
        </div>
      </div>
    </article>
  );
}
