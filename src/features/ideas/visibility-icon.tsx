import { Globe, Link as LinkIcon, LockKeyhole } from "lucide-react";

import type { IdeaVisibility } from "./idea-visibility.js";

type VisibilityIconProps = {
  className?: string;
  visibility: IdeaVisibility;
};

const icons = {
  PUBLIC: Globe,
  UNLISTED: LinkIcon,
  PRIVATE: LockKeyhole,
} satisfies Record<IdeaVisibility, typeof Globe>;

export function VisibilityIcon({ className, visibility }: VisibilityIconProps) {
  const Icon = icons[visibility];

  return <Icon aria-hidden="true" className={className} />;
}
