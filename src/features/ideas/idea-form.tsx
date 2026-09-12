import { ActionFeedback } from "../../components/ui/action-feedback.js";
import { Button } from "../../components/ui/button.js";
import { twIdeaTitleInput } from "../../styles/idea-page-styles.js";
import { IdeaPageToolbar } from "./idea-page-ui.js";
import { revalidateLogic, useForm } from "@tanstack/react-form";
import { Check } from "lucide-react";
import { z } from "zod";

import type { CreateIdeaInput } from "../../api/ideas.js";
import { TechnicalMarkdownEditor } from "../markdown/technical-markdown-editor.js";
import { TagSelector } from "../tags/tag-selector.js";
import { IDEA_STATUSES } from "./idea-status.js";
import { IDEA_VISIBILITIES } from "./idea-visibility.js";
import { StatusSelect } from "./status-select.js";
import { VisibilitySelect } from "./visibility-select.js";

const ideaFormSchema = z
  .object({
    title: z.string().trim().min(1, "Give the idea a title.").max(200),
    content: z.string().max(200_000),
    status: z.enum(IDEA_STATUSES),
    visibility: z.enum(IDEA_VISIBILITIES),
    tags: z.array(z.string().trim().min(1).max(50)).max(20),
    tagDraft: z.string().trim().max(50, "Tags can be up to 50 characters."),
  })
  .superRefine((value, context) => {
    const uniqueTags = new Set(
      [...value.tags, value.tagDraft]
        .map((tag) => tag.trim().toLocaleLowerCase("en-US"))
        .filter(Boolean),
    );

    if (uniqueTags.size > 20) {
      context.addIssue({
        code: "custom",
        message: "Use no more than 20 tags.",
        path: ["tags"],
      });
    }
  });

type IdeaFormValues = z.infer<typeof ideaFormSchema>;
export type IdeaFormSubmission = Required<CreateIdeaInput>;

type IdeaFormProps = {
  initialValues: Omit<IdeaFormValues, "tagDraft">;
  mode: "create" | "edit";
  onCancel: () => void;
  onSubmit: (value: IdeaFormSubmission) => Promise<void>;
  submissionError?: string;
};

function firstError(errors: unknown[]): string | undefined {
  for (const error of errors) {
    if (typeof error === "string") return error;
    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string"
    ) {
      return error.message;
    }
  }

  return undefined;
}

function normalizeTags(tags: string[], draft: string) {
  const uniqueTags = new Map<string, string>();

  for (const tag of [...tags, draft]) {
    const normalized = tag.trim();
    if (!normalized) continue;
    const key = normalized.toLocaleLowerCase("en-US");
    if (!uniqueTags.has(key)) uniqueTags.set(key, normalized);
  }

  return [...uniqueTags.values()];
}

type IdeaFormActionButtonsProps = {
  canSubmit: boolean;
  isSubmitting: boolean;
  mode: IdeaFormProps["mode"];
  onCancel: () => void;
};

function IdeaFormActionButtons({
  canSubmit,
  isSubmitting,
  mode,
  onCancel,
}: IdeaFormActionButtonsProps) {
  return (
    <>
      <Button
        type="button"
        disabled={isSubmitting}
        variant="ghost"
        onClick={onCancel}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        variant="primary"
        disabled={!canSubmit || isSubmitting}
        loading={isSubmitting}
        loadingLabel={mode === "create" ? "Saving idea…" : "Saving revision…"}
      >
        <Check size={16} aria-hidden="true" />
        {mode === "create" ? "Create idea" : "Save changes"}
      </Button>
    </>
  );
}

export function IdeaForm({
  initialValues,
  mode,
  onCancel,
  onSubmit,
  submissionError,
}: IdeaFormProps) {
  const form = useForm({
    defaultValues: {
      ...initialValues,
      tagDraft: "",
    },
    validationLogic: revalidateLogic({
      mode: "submit",
      modeAfterSubmission: "blur",
    }),
    validators: {
      onDynamic: ideaFormSchema,
    },
    onSubmit: async ({ value }) =>
      onSubmit({
        title: value.title.trim(),
        content: value.content,
        status: value.status,
        visibility: value.visibility,
        tags: normalizeTags(value.tags, value.tagDraft),
      }),
  });
  const contentDescriptionId = "idea-content-guidance";
  const tagDescriptionId = "idea-tags-guidance";

  return (
    <form
      className="min-w-0 pb-12"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <h1 className="sr-only">
        {mode === "create" ? "New idea" : "Edit idea"}
      </h1>
      <form.Subscribe
        selector={(state) => [
          state.isDirty,
          state.canSubmit,
          state.isSubmitting,
        ]}
      >
        {([isDirty, canSubmit, isSubmitting]) => (
          <IdeaPageToolbar
            title={mode === "create" ? "New idea" : "Edit idea"}
            onBack={onCancel}
            backLabel={mode === "create" ? "Ideas" : "Idea"}
            disabled={isSubmitting}
            sticky
            status={
              isSubmitting
                ? "Saving…"
                : isDirty
                  ? "Unsaved changes"
                  : mode === "edit"
                    ? "No changes yet"
                    : ""
            }
            actions={
              <IdeaFormActionButtons
                canSubmit={canSubmit}
                isSubmitting={isSubmitting}
                mode={mode}
                onCancel={onCancel}
              />
            }
          />
        )}
      </form.Subscribe>
      <ActionFeedback
        state={submissionError ? "error" : "idle"}
        className={submissionError ? "mt-5" : ""}
      >
        {submissionError
          ? `Couldn’t save your idea. ${submissionError} Your draft is still here. Try saving again.`
          : null}
      </ActionFeedback>
      <div className="grid min-w-0 items-start gap-10 pt-9 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-12">
        <div className="grid min-w-0 gap-8">
          <form.Field name="title">
            {(field) => {
              const error = firstError(field.state.meta.errors);
              return (
                <label className="grid min-w-0 gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Title
                  </span>
                  <textarea
                    rows={2}
                    className={`${twIdeaTitleInput} min-h-24 w-full scroll-mt-60 resize-y rounded-control border-0 bg-transparent p-0 text-idea-title text-foreground outline-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring/40 [field-sizing:content]`}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        !event.nativeEvent.isComposing
                      )
                        event.preventDefault();
                    }}
                    name={field.name}
                    value={field.state.value}
                    maxLength={200}
                    required
                    autoFocus={mode === "create"}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${field.name}-error` : undefined}
                    placeholder="Give your idea a title…"
                    onBlur={field.handleBlur}
                    onChange={(event) =>
                      field.handleChange(event.currentTarget.value)
                    }
                  />
                  <span className="flex justify-between gap-3 text-caption leading-relaxed text-muted-foreground">
                    {error ? (
                      <span
                        id={`${field.name}-error`}
                        className="text-xs text-danger"
                        role="alert"
                      >
                        {error}
                      </span>
                    ) : (
                      <span>Required</span>
                    )}
                    <span>{field.state.value.length}/200</span>
                  </span>
                </label>
              );
            }}
          </form.Field>

          <form.Field name="content">
            {(field) => {
              const error = firstError(field.state.meta.errors);
              return (
                <div className="grid min-w-0 gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-caption text-muted-foreground">
                    <span className="text-xs font-medium text-muted-foreground">
                      Notes
                    </span>
                    <p id={contentDescriptionId}>
                      Optional · Add context, links, or a checklist.
                    </p>
                  </div>
                  <TechnicalMarkdownEditor
                    initialMarkdown={initialValues.content}
                    invalid={Boolean(error)}
                    describedBy={
                      error ? `${field.name}-error` : contentDescriptionId
                    }
                    onBlur={field.handleBlur}
                    onChange={field.handleChange}
                  />
                  {error ? (
                    <p
                      id={`${field.name}-error`}
                      className="text-xs text-danger"
                      role="alert"
                    >
                      {error}
                    </p>
                  ) : null}
                </div>
              );
            }}
          </form.Field>
        </div>
        <aside
          aria-label="Idea settings"
          className="grid min-w-0 items-start gap-6 border-t border-border/70 pt-6 sm:grid-cols-2 lg:sticky lg:top-40 lg:grid-cols-1 lg:border-t-0 lg:border-l lg:pt-1 lg:pl-6"
        >
          <h2 className="col-span-full text-sm font-medium">Details</h2>
          <form.Field name="status">
            {(field) => (
              <StatusSelect
                className="grid min-w-0 gap-2"
                label="Status"
                labelClassName="text-xs font-medium text-muted-foreground"
                name={field.name}
                onBlur={field.handleBlur}
                onValueChange={(status) => {
                  if (status) field.handleChange(status);
                }}
                size="form"
                value={field.state.value}
              />
            )}
          </form.Field>

          <form.Field name="visibility">
            {(field) => (
              <VisibilitySelect
                className="grid min-w-0 gap-2"
                description={
                  <span className="flex justify-between gap-3 text-caption leading-relaxed text-muted-foreground">
                    <span>
                      {field.state.value === "PUBLIC"
                        ? "Shown in the public feed and search."
                        : field.state.value === "UNLISTED"
                          ? "Hidden from feeds and search, but its URL works for anyone."
                          : "Hidden from everyone except you."}
                    </span>
                  </span>
                }
                label="Visibility"
                labelClassName="text-xs font-medium text-muted-foreground"
                name={field.name}
                onBlur={field.handleBlur}
                onValueChange={(visibility) => {
                  if (visibility) field.handleChange(visibility);
                }}
                value={field.state.value}
              />
            )}
          </form.Field>

          <form.Field name="tags">
            {(tagsField) => (
              <form.Field name="tagDraft">
                {(draftField) => {
                  const error =
                    firstError(tagsField.state.meta.errors) ??
                    firstError(draftField.state.meta.errors);
                  return (
                    <div className="col-span-full grid min-w-0 gap-2">
                      <label
                        htmlFor="idea-tags"
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Tags
                      </label>
                      <TagSelector
                        inputId="idea-tags"
                        tags={tagsField.state.value}
                        draft={draftField.state.value}
                        invalid={Boolean(error)}
                        describedBy={
                          error ? "idea-tags-error" : tagDescriptionId
                        }
                        onBlur={() => {
                          tagsField.handleBlur();
                          draftField.handleBlur();
                        }}
                        onChange={tagsField.handleChange}
                        onDraftChange={draftField.handleChange}
                      />
                      {error ? (
                        <p
                          id="idea-tags-error"
                          className="text-xs text-danger"
                          role="alert"
                        >
                          {error}
                        </p>
                      ) : (
                        <p
                          id={tagDescriptionId}
                          className="text-caption leading-relaxed text-muted-foreground"
                        >
                          Find a tag or press Enter to add one.
                        </p>
                      )}
                    </div>
                  );
                }}
              </form.Field>
            )}
          </form.Field>
        </aside>
      </div>
    </form>
  );
}
