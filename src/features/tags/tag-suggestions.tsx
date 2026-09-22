import * as React from "react";
import { Plus } from "lucide-react";

import { ApiClientError } from "../../api/client.js";
import { suggestTags, type SuggestedTag } from "../../api/tags.js";
import { ActionFeedback } from "../../components/ui/action-feedback.js";
import { Button } from "../../components/ui/button.js";

type DraftValues = {
  title: string;
  content: string;
  tags: string[];
  tagDraft: string;
};

type Attempt = {
  snapshot: string;
  state: "pending" | "results" | "empty" | "error";
  tags: SuggestedTag[];
};

type TagSuggestionsProps = {
  children: React.ReactNode;
  getValues: () => DraftValues;
  onAdd: (name: string) => void;
  isSubmitting: boolean;
  values: DraftValues;
};

function tagKey(name: string) {
  return name.trim().toLocaleLowerCase("en-US");
}

function selectedTags(values: DraftValues) {
  const unique = new Map<string, string>();
  for (const tag of [...values.tags, values.tagDraft]) {
    const name = tag.trim();
    if (name && !unique.has(tagKey(name))) unique.set(tagKey(name), name);
  }
  return [...unique.values()];
}

function snapshotFor(values: DraftValues) {
  return JSON.stringify([
    values.title,
    values.content,
    values.tags,
    values.tagDraft,
  ]);
}

export function TagSuggestions({
  children,
  getValues,
  onAdd,
  isSubmitting,
  values,
}: TagSuggestionsProps) {
  const [attempt, setAttempt] = React.useState<Attempt | null>(null);
  const [hasRequested, setHasRequested] = React.useState(false);
  const [blocked, setBlocked] = React.useState<"quota" | "unavailable" | null>(
    null,
  );
  const generation = React.useRef(0);
  const controller = React.useRef<AbortController | null>(null);
  const actionRef = React.useRef<HTMLButtonElement>(null);
  const chipRefs = React.useRef(new Map<string, HTMLButtonElement>());
  const currentSnapshot = snapshotFor(values);
  const visibleAttempt = attempt?.snapshot === currentSnapshot ? attempt : null;
  const selected = selectedTags(values);
  const canSuggest =
    !isSubmitting &&
    !blocked &&
    selected.length < 20 &&
    Boolean(values.title.trim() || values.content.trim()) &&
    visibleAttempt?.state !== "pending";

  React.useEffect(() => {
    if (!attempt || attempt.snapshot === currentSnapshot) return;
    if (attempt.state === "pending") {
      generation.current += 1;
      controller.current?.abort();
      controller.current = null;
    }
    setAttempt(null);
  }, [attempt, currentSnapshot]);

  React.useEffect(
    () => () => {
      generation.current += 1;
      controller.current?.abort();
    },
    [],
  );

  async function requestSuggestions() {
    if (!canSuggest) return;
    const input = getValues();
    const tags = selectedTags(input);
    if (tags.length >= 20 || (!input.title.trim() && !input.content.trim()))
      return;

    generation.current += 1;
    controller.current?.abort();
    const requestGeneration = generation.current;
    const requestSnapshot = snapshotFor(input);
    const abortController = new AbortController();
    controller.current = abortController;
    setHasRequested(true);
    setAttempt({ snapshot: requestSnapshot, state: "pending", tags: [] });

    try {
      const result = await suggestTags(
        { title: input.title, content: input.content, tags },
        abortController.signal,
      );
      if (
        requestGeneration !== generation.current ||
        requestSnapshot !== snapshotFor(getValues())
      )
        return;
      setAttempt({
        snapshot: requestSnapshot,
        state: result.tags.length ? "results" : "empty",
        tags: result.tags,
      });
    } catch (error) {
      if (
        requestGeneration !== generation.current ||
        requestSnapshot !== snapshotFor(getValues())
      )
        return;
      if (error instanceof ApiClientError) {
        if (error.code === "SUGGESTIONS_QUOTA_REACHED") setBlocked("quota");
        if (error.code === "SUGGESTIONS_UNAVAILABLE") {
          setBlocked("unavailable");
        }
      }
      setAttempt({ snapshot: requestSnapshot, state: "error", tags: [] });
    } finally {
      if (requestGeneration === generation.current) controller.current = null;
    }
  }

  function acceptTag(tag: SuggestedTag, index: number) {
    const latest = getValues();
    if (selectedTags(latest).length >= 20) return;
    if (
      selectedTags(latest).some((name) => tagKey(name) === tagKey(tag.name))
    ) {
      return;
    }
    const remaining =
      visibleAttempt?.tags.filter((candidate) => candidate.id !== tag.id) ?? [];
    const nextId = remaining[Math.min(index, remaining.length - 1)]?.id;
    onAdd(tag.name);
    const atLimit = selectedTags(getValues()).length >= 20;
    setAttempt(
      remaining.length && !atLimit
        ? {
            snapshot: snapshotFor(getValues()),
            state: "results",
            tags: remaining,
          }
        : null,
    );
    window.requestAnimationFrame(() => {
      if (nextId && !atLimit) chipRefs.current.get(nextId)?.focus();
      else {
        const input = document.getElementById("idea-tags") as HTMLInputElement;
        if (!input.disabled) input.focus();
        else
          document
            .querySelector<HTMLButtonElement>(".tag-selector .tag-token button")
            ?.focus();
      }
    });
  }

  const feedbackState = blocked
    ? "error"
    : visibleAttempt?.state === "error"
      ? "error"
      : visibleAttempt?.state === "pending"
        ? "pending"
        : visibleAttempt?.state === "results" ||
            visibleAttempt?.state === "empty"
          ? "success"
          : "idle";
  const feedback =
    blocked === "quota"
      ? "Suggestion limit reached. You can still add tags manually."
      : blocked === "unavailable"
        ? "Suggestions are unavailable right now. You can still add tags manually."
        : visibleAttempt?.state === "pending"
          ? "Finding matches among existing tags…"
          : visibleAttempt?.state === "error"
            ? "Couldn’t suggest tags. Your draft is unchanged."
            : visibleAttempt?.state === "results"
              ? `${visibleAttempt.tags.length} tag suggestion${visibleAttempt.tags.length === 1 ? "" : "s"} available.`
              : null;

  return (
    <div className="col-span-full grid min-w-0 gap-2">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <label
          htmlFor="idea-tags"
          className="text-xs font-medium text-muted-foreground"
        >
          Tags
        </label>
        <Button
          ref={actionRef}
          type="button"
          variant="secondary"
          className="[&]:min-h-9 [&]:px-2.5 [&]:py-1 [&]:text-caption [@media(pointer:coarse)]:[&]:min-h-control"
          disabled={!canSuggest}
          loading={visibleAttempt?.state === "pending"}
          loadingLabel="Finding tags…"
          onClick={() => void requestSuggestions()}
        >
          {blocked
            ? "Suggest tags"
            : visibleAttempt?.state === "error"
              ? "Retry"
              : hasRequested
                ? "Suggest again"
                : "Suggest tags"}
        </Button>
      </div>
      {children}
      <p className="text-caption leading-relaxed text-muted-foreground">
        Sends your title and notes to Jev. Nothing is added until you choose a
        tag.
      </p>
      <ActionFeedback state={feedbackState}>{feedback}</ActionFeedback>
      {visibleAttempt?.state === "results" ? (
        <div className="mt-3 min-w-0 border-t border-border/70 pt-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-caption font-medium text-muted-foreground">
              Suggested tags
            </h3>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setAttempt(null);
                actionRef.current?.focus();
              }}
            >
              Clear suggestions
            </Button>
          </div>
          <div className="mt-2 flex min-w-0 flex-wrap gap-2">
            {visibleAttempt.tags.map((tag, index) => (
              <button
                key={tag.id}
                ref={(node) => {
                  if (node) chipRefs.current.set(tag.id, node);
                  else chipRefs.current.delete(tag.id);
                }}
                type="button"
                aria-label={`Add ${tag.name} tag`}
                className="inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-control border border-border bg-surface-muted px-2.5 py-1 text-left text-metadata text-foreground transition-colors hover:border-border-strong hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [@media(pointer:coarse)]:min-h-control motion-reduce:transition-none"
                onClick={() => acceptTag(tag, index)}
              >
                <Plus aria-hidden="true" className="size-3.5 shrink-0" />
                <span className="min-w-0 wrap-anywhere">{tag.name}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {visibleAttempt?.state === "empty" && !blocked ? (
        <p className="mt-3 text-caption leading-relaxed text-muted-foreground">
          No strong matches. You can still search or create a tag above.
        </p>
      ) : null}
    </div>
  );
}
