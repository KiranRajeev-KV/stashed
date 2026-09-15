import {
  Bookmark,
  BriefcaseBusiness,
  Code2,
  Folder,
  Heart,
  Layers3,
  Library,
  Lightbulb,
  Palette,
  Rocket,
  type LucideIcon,
} from "lucide-react";

const COLLECTION_ICONS = [
  "folder",
  "bookmark",
  "library",
  "lightbulb",
  "layers",
  "briefcase",
  "palette",
  "rocket",
  "code",
  "heart",
] as const;
export type CollectionIconKey = (typeof COLLECTION_ICONS)[number];

const icons: Record<CollectionIconKey, LucideIcon> = {
  folder: Folder,
  bookmark: Bookmark,
  library: Library,
  lightbulb: Lightbulb,
  layers: Layers3,
  briefcase: BriefcaseBusiness,
  palette: Palette,
  rocket: Rocket,
  code: Code2,
  heart: Heart,
};

export function CollectionIcon({
  icon,
  className = "size-5",
}: {
  icon: string;
  className?: string;
}) {
  const Icon = icons[icon as CollectionIconKey] ?? Folder;
  return <Icon className={className} aria-hidden="true" />;
}

export function CollectionIconPicker({
  value,
  onChange,
  disabled,
}: {
  value: CollectionIconKey;
  onChange: (value: CollectionIconKey) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className="min-w-0" disabled={disabled}>
      <legend className="text-caption font-medium text-muted-foreground">
        Icon
      </legend>
      <div className="mt-2 grid grid-cols-5 gap-1.5">
        {COLLECTION_ICONS.map((key) => {
          const Icon = icons[key];
          return (
            <button
              key={key}
              type="button"
              aria-label={`${key} icon`}
              aria-pressed={value === key}
              onClick={() => onChange(key)}
              className="grid min-h-control min-w-0 place-items-center rounded-control border border-transparent bg-transparent text-muted-foreground transition-colors duration-(--duration-fast) hover:bg-surface-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-pressed:border-border-strong aria-pressed:bg-surface-muted aria-pressed:text-foreground aria-pressed:shadow-control disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
            >
              <Icon size={18} aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
