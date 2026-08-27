import { revalidateLogic, useForm } from "@tanstack/react-form";
import { LoaderCircle } from "lucide-react";
import { z } from "zod";

import type { CreateIdeaInput } from "../../api/ideas.js";
import { TechnicalMarkdownEditor } from "../markdown/technical-markdown-editor.js";
import { TagSelector } from "../tags/tag-selector.js";
import { IDEA_STATUSES } from "./idea-status.js";
import { StatusSelect } from "./status-select.js";

const IDEA_VISIBILITIES = ["PUBLIC", "UNLISTED", "PRIVATE"] as const;

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
      className="idea-form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <div className="idea-form-metadata">
        <form.Field name="title">
          {(field) => {
            const error = firstError(field.state.meta.errors);
            return (
              <label className="idea-form-field">
                <span className="idea-form-label">Title</span>
                <input
                  name={field.name}
                  value={field.state.value}
                  maxLength={200}
                  autoFocus={mode === "create"}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? `${field.name}-error` : undefined}
                  placeholder="A concise name for the idea"
                  onBlur={field.handleBlur}
                  onChange={(event) =>
                    field.handleChange(event.currentTarget.value)
                  }
                />
                <span className="idea-form-field-foot">
                  {error ? (
                    <span
                      id={`${field.name}-error`}
                      className="idea-form-error"
                      role="alert"
                    >
                      {error}
                    </span>
                  ) : (
                    <span>Make it recognizable to you and the group.</span>
                  )}
                  <span>{field.state.value.length}/200</span>
                </span>
              </label>
            );
          }}
        </form.Field>

        <form.Field name="status">
          {(field) => (
            <StatusSelect
              className="idea-form-field idea-form-status-field"
              description={
                <span className="idea-form-field-foot">
                  <span>Where this thought sits in its lifecycle.</span>
                </span>
              }
              label="Status"
              labelClassName="idea-form-label"
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
            <label className="idea-form-field">
              <span className="idea-form-label">Visibility</span>
              <select
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) =>
                  field.handleChange(
                    event.currentTarget
                      .value as (typeof IDEA_VISIBILITIES)[number],
                  )
                }
              >
                <option value="PUBLIC">Public — listed for everyone</option>
                <option value="UNLISTED">
                  Unlisted — anyone with the link
                </option>
                <option value="PRIVATE">Private — only you</option>
              </select>
              <span className="idea-form-field-foot">
                <span>
                  {field.state.value === "PUBLIC"
                    ? "Shown in the public feed and search."
                    : field.state.value === "UNLISTED"
                      ? "Hidden from feeds and search, but its URL works for anyone."
                      : "Hidden from everyone except you."}
                </span>
              </span>
            </label>
          )}
        </form.Field>
      </div>

      <form.Field name="tags">
        {(tagsField) => (
          <form.Field name="tagDraft">
            {(draftField) => {
              const error =
                firstError(tagsField.state.meta.errors) ??
                firstError(draftField.state.meta.errors);
              return (
                <div className="idea-form-field">
                  <label htmlFor="idea-tags" className="idea-form-label">
                    Tags
                  </label>
                  <TagSelector
                    inputId="idea-tags"
                    tags={tagsField.state.value}
                    draft={draftField.state.value}
                    invalid={Boolean(error)}
                    describedBy={error ? "idea-tags-error" : tagDescriptionId}
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
                      className="idea-form-error"
                      role="alert"
                    >
                      {error}
                    </p>
                  ) : (
                    <p id={tagDescriptionId} className="idea-form-guidance">
                      Search existing tags, or type a new one and press Enter or
                      comma.
                    </p>
                  )}
                </div>
              );
            }}
          </form.Field>
        )}
      </form.Field>

      <form.Field name="content">
        {(field) => {
          const error = firstError(field.state.meta.errors);
          return (
            <div className="idea-form-field">
              <div className="idea-form-editor-heading">
                <span className="idea-form-label">Content</span>
                <p id={contentDescriptionId}>
                  Optional. Markdown is stored underneath, so formatting remains
                  portable.
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
                  className="idea-form-error"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}
            </div>
          );
        }}
      </form.Field>

      <div className="idea-form-actions">
        <button type="button" className="idea-form-cancel" onClick={onCancel}>
          Cancel
        </button>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <button
              type="submit"
              className="idea-form-submit"
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="idea-form-spinner"
                />
              ) : null}
              {isSubmitting
                ? mode === "create"
                  ? "Saving idea…"
                  : "Saving revision…"
                : mode === "create"
                  ? "Create idea"
                  : "Save changes"}
            </button>
          )}
        </form.Subscribe>
      </div>

      {submissionError ? (
        <p className="idea-form-submit-error" role="alert">
          {submissionError} Your draft is still here.
        </p>
      ) : null}
    </form>
  );
}
