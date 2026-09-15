import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Check } from "lucide-react";
import { Link } from "@tanstack/react-router";

import type { CreateCollectionInput } from "../../api/collections.js";
import type { SelectPortalContainer } from "../../components/ui/select.js";
import { Button } from "../../components/ui/button.js";
import { ActionFeedback } from "../../components/ui/action-feedback.js";
import {
  BreadcrumbCurrent,
  BreadcrumbItem,
  BreadcrumbLink,
  Breadcrumbs,
  BreadcrumbSeparator,
} from "../../components/ui/breadcrumb.js";
import { ResourcePageToolbar } from "../../components/ui/resource-page-toolbar.js";
import { twFormTitleInput } from "../../styles/common-styles.js";
import { twResourceEditSheetFooter } from "../../styles/dialogs-styles.js";
import { VisibilitySelect } from "../ideas/visibility-select.js";
import {
  CollectionIconPicker,
  type CollectionIconKey,
} from "./collection-icon.js";

type Values = Required<CreateCollectionInput>;

export function CollectionForm({
  initialValues = {
    name: "",
    description: "",
    icon: "folder",
    visibility: "PUBLIC",
  },
  mode = "create",
  canChangeVisibility = true,
  error,
  sheet = false,
  hidden = false,
  id,
  labelledBy,
  additionalContent,
  onDirtyChange,
  selectPortalContainer,
  onCancel,
  onSubmit,
}: {
  initialValues?: Values;
  mode?: "create" | "edit";
  canChangeVisibility?: boolean;
  error?: string;
  /** Uses the constrained, scrollable layout intended for ResourceEditSheet. */
  sheet?: boolean;
  /** Keep a settings tab mounted while it is visually inactive to retain drafts. */
  hidden?: boolean;
  id?: string;
  labelledBy?: string;
  additionalContent?: ReactNode;
  onDirtyChange?: (dirty: boolean) => void;
  selectPortalContainer?: SelectPortalContainer;
  onCancel: () => void;
  onSubmit: (values: Values) => Promise<void>;
}) {
  const [values, setValues] = useState(initialValues);
  const [pending, setPending] = useState(false);
  const isDirty =
    values.name !== initialValues.name ||
    values.description !== initialValues.description ||
    values.icon !== initialValues.icon ||
    values.visibility !== initialValues.visibility;
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!values.name.trim()) return;
    setPending(true);
    try {
      await onSubmit({
        ...values,
        name: values.name.trim(),
        description: values.description.trim(),
      });
    } catch {
      // The parent mutation renders and announces the error without clearing input.
    } finally {
      setPending(false);
    }
  }
  return (
    <form
      id={id}
      role={id ? "tabpanel" : undefined}
      aria-labelledby={labelledBy}
      onSubmit={(event) => void submit(event)}
      className={`min-w-0 ${hidden ? "hidden" : ""} ${mode === "create" ? "pb-12" : ""} ${sheet ? "flex min-h-0 flex-1 flex-col" : ""}`}
      noValidate
    >
      {mode === "create" ? (
        <>
          <h1 className="sr-only">New collection</h1>
          <ResourcePageToolbar
            breadcrumbs={
              <Breadcrumbs>
                <BreadcrumbItem>
                  <BreadcrumbLink>
                    <Link to="/collections">Collections</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbCurrent>New collection</BreadcrumbCurrent>
                </BreadcrumbItem>
              </Breadcrumbs>
            }
            sticky
            status={pending ? "Saving…" : isDirty ? "Unsaved changes" : ""}
            actions={
              <>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={pending}
                  onClick={onCancel}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={pending}
                  loadingLabel="Saving collection…"
                  disabled={!values.name.trim() || pending}
                >
                  <Check size={16} aria-hidden="true" />
                  Create collection
                </Button>
              </>
            }
          />
          <ActionFeedback
            className={error ? "mt-5" : ""}
            state={error ? "error" : "idle"}
          >
            {error
              ? `Couldn’t save your collection. ${error} Your draft is still here. Try saving again.`
              : null}
          </ActionFeedback>
        </>
      ) : null}
      <div
        className={`grid min-w-0 items-start gap-8 ${
          mode === "create"
            ? "pt-9 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-12"
            : sheet
              ? "min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-6"
              : "lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-10"
        }`}
      >
        <div
          className={`grid min-w-0 ${mode === "create" ? "gap-8" : "gap-6"}`}
        >
          <label className="grid min-w-0 gap-2">
            <span className="text-caption font-medium text-muted-foreground">
              Name
            </span>
            <textarea
              rows={2}
              autoFocus
              required
              maxLength={200}
              value={values.name}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.nativeEvent.isComposing)
                  event.preventDefault();
              }}
              onChange={(event) =>
                setValues({ ...values, name: event.currentTarget.value })
              }
              className={`${twFormTitleInput} w-full font-display [field-sizing:content] ${mode === "create" ? "min-h-24 text-idea-title" : "min-h-16 text-document-title"}`}
              placeholder="Give the collection a name…"
            />
            <span className="flex justify-between gap-3 text-caption text-muted-foreground">
              <span>Required</span>
              <span>{values.name.length}/200</span>
            </span>
          </label>
          <label className="grid gap-2">
            <span className="text-caption font-medium text-muted-foreground">
              Description
            </span>
            <textarea
              rows={10}
              maxLength={2000}
              value={values.description}
              onChange={(event) =>
                setValues({ ...values, description: event.currentTarget.value })
              }
              className={`resize-y rounded-control border border-border bg-surface px-3 py-2.5 text-body leading-reading text-foreground shadow-control placeholder:text-muted-foreground/70 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 ${mode === "create" ? "min-h-64" : "min-h-40"}`}
              placeholder="Explain what belongs here…"
            />
            <span className="flex justify-between gap-3 text-caption text-muted-foreground">
              <span>Plain text</span>
              <span>{values.description.length}/2000</span>
            </span>
          </label>
        </div>
        <aside
          className={`grid min-w-0 gap-6 ${
            mode === "create"
              ? "border-t border-border/70 pt-6 sm:grid-cols-2 lg:sticky lg:top-40 lg:grid-cols-1 lg:border-t-0 lg:border-l lg:pt-1 lg:pl-6"
              : sheet
                ? "border-t border-border-subtle pt-6"
                : "border-y border-border-subtle py-5 lg:border-y-0 lg:border-l lg:py-0 lg:pl-6"
          }`}
          aria-label="Collection properties"
        >
          {mode === "create" ? (
            <h2 className="col-span-full text-sm font-medium">Details</h2>
          ) : null}
          <CollectionIconPicker
            value={values.icon as CollectionIconKey}
            onChange={(icon) => setValues({ ...values, icon })}
            disabled={pending}
          />
          {canChangeVisibility ? (
            <VisibilitySelect
              className="grid gap-2"
              description="Public is discoverable. Unlisted requires its link. Private requires explicit access."
              disabled={pending}
              modal={sheet ? false : undefined}
              label="Visibility"
              labelClassName="text-caption font-medium text-muted-foreground"
              portalContainer={selectPortalContainer}
              value={values.visibility}
              onValueChange={(visibility) => {
                if (visibility) setValues({ ...values, visibility });
              }}
            />
          ) : null}
          <p className="text-caption leading-relaxed text-muted-foreground">
            Collection access never grants permission to edit the Ideas inside
            it.
          </p>
        </aside>
        {additionalContent ? (
          <div className="border-t border-border-subtle pt-6">
            {additionalContent}
          </div>
        ) : null}
      </div>
      {mode === "edit" ? (
        <>
          <div
            className={
              sheet
                ? twResourceEditSheetFooter
                : "mt-7 border-t border-border-subtle pt-4"
            }
          >
            <ActionFeedback
              className={sheet ? "mb-3" : "mb-6"}
              state={error ? "error" : "idle"}
            >
              {error}
            </ActionFeedback>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="ghost" onClick={onCancel} disabled={pending}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={pending}
                loadingLabel="Saving…"
                disabled={!values.name.trim()}
              >
                <Check size={16} aria-hidden="true" />
                Save changes
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </form>
  );
}
