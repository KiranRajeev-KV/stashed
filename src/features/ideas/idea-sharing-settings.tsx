import { useId } from "react";
import {
  IDEA_ACCESSES,
  IDEA_ACCESS_DESCRIPTIONS,
  IDEA_ACCESS_LABELS,
  IDEA_DISTRIBUTIONS,
  IDEA_DISTRIBUTION_DESCRIPTIONS,
  IDEA_DISTRIBUTION_LABELS,
  IDEA_LINK_ONLY_MEMBERSHIP_NOTE,
  IDEA_PUBLIC_LINK_NOTE,
  type IdeaAccess,
  type IdeaDistribution,
} from "./idea-sharing.js";

function SharingChoices<T extends string>({
  label,
  name,
  values,
  labels,
  descriptions,
  value,
  disabled,
  onChange,
  onBlur,
}: {
  label: string;
  name: string;
  values: readonly T[];
  labels: Record<T, string>;
  descriptions: Record<T, string>;
  value: T;
  disabled: boolean;
  onChange: (value: T) => void;
  onBlur: () => void;
}) {
  const id = useId();
  return (
    <fieldset disabled={disabled} className="grid min-w-0 gap-1.5">
      <legend className="mb-2 text-ui font-medium">{label}</legend>
      {values.map((choice) => (
        <label
          key={choice}
          className="flex min-h-11 cursor-pointer items-start gap-2.5 rounded-control border border-transparent px-2.5 py-2 has-checked:border-border has-checked:bg-surface-muted has-disabled:cursor-default has-disabled:opacity-60"
        >
          <input
            type="radio"
            name={name}
            value={choice}
            checked={value === choice}
            onChange={() => onChange(choice)}
            onBlur={onBlur}
            aria-describedby={`${id}-${choice}-description`}
            className="mt-1 size-4 shrink-0 accent-primary focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ring"
          />
          <span className="grid min-w-0 gap-1">
            <span className="text-ui">{labels[choice]}</span>
            <span
              id={`${id}-${choice}-description`}
              className="text-caption text-muted-foreground"
            >
              {descriptions[choice]}
            </span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}

export function IdeaSharingSettings({
  access,
  distribution,
  disabled,
  mode,
  onAccessChange,
  onDistributionChange,
  onAccessBlur,
  onDistributionBlur,
}: {
  access: IdeaAccess;
  distribution: IdeaDistribution;
  disabled: boolean;
  mode: "create" | "edit";
  onAccessChange: (value: IdeaAccess) => void;
  onDistributionChange: (value: IdeaDistribution) => void;
  onAccessBlur: () => void;
  onDistributionBlur: () => void;
}) {
  const id = useId();
  return (
    <section
      aria-labelledby={`${id}-heading`}
      className="col-span-full grid min-w-0 gap-4 border-t border-border/70 pt-5"
    >
      <h2 id={`${id}-heading`} className="text-ui font-medium">
        Sharing
      </h2>
      <SharingChoices
        label="Who can view this idea?"
        name={`${id}-access`}
        values={IDEA_ACCESSES}
        labels={IDEA_ACCESS_LABELS}
        descriptions={IDEA_ACCESS_DESCRIPTIONS}
        value={access}
        disabled={disabled}
        onChange={onAccessChange}
        onBlur={onAccessBlur}
      />
      {access === "PUBLIC" ? (
        <>
          <SharingChoices
            label="Where should it appear?"
            name={`${id}-distribution`}
            values={IDEA_DISTRIBUTIONS}
            labels={IDEA_DISTRIBUTION_LABELS}
            descriptions={IDEA_DISTRIBUTION_DESCRIPTIONS}
            value={distribution}
            disabled={disabled}
            onChange={onDistributionChange}
            onBlur={onDistributionBlur}
          />
          <p className="text-caption text-muted-foreground">
            {IDEA_PUBLIC_LINK_NOTE}
          </p>
          {distribution === "COLLECTIONS_ONLY" ? (
            <p className="text-caption text-muted-foreground">
              Choosing this does not add the idea to a collection.
            </p>
          ) : null}
          {mode === "edit" && distribution === "UNLISTED" ? (
            <p className="text-caption text-muted-foreground">
              {IDEA_LINK_ONLY_MEMBERSHIP_NOTE}
            </p>
          ) : null}
        </>
      ) : (
        <p className="text-caption text-muted-foreground">
          If you choose Anyone again, this idea will use:{" "}
          <span className="font-medium text-foreground">
            {IDEA_DISTRIBUTION_LABELS[distribution]}
          </span>
          .
        </p>
      )}
    </section>
  );
}
