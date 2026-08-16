import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Link, getRouteApi, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { ApiClientError } from "../../api/client.js";
import {
  createIdea,
  ideaQueryKey,
  ideaQueryOptions,
  updateIdea,
} from "../../api/ideas.js";
import { IdeaForm, type IdeaFormSubmission } from "./idea-form.js";

const editRouteApi = getRouteApi("/_authenticated/ideas/$ideaId/edit");
const authenticatedRouteApi = getRouteApi("/_authenticated");

function IdeaFormHeader({ mode }: { mode: "create" | "edit" }) {
  return (
    <header className="idea-form-page-header">
      <p className="font-mono text-label uppercase text-accent">
        {mode === "create" ? "Fresh page" : "Revision"}
      </p>
      <h1 className="mt-3 text-page-title font-semibold">
        {mode === "create" ? "New idea" : "Edit idea"}
      </h1>
      <p className="mt-4 max-w-2xl text-prose text-muted-foreground">
        {mode === "create"
          ? "Capture the shape of a thought now; develop the details when they arrive."
          : "Return to the note, sharpen the language, and move the idea forward."}
      </p>
    </header>
  );
}

function IdeaFormSkeleton() {
  return (
    <section
      aria-label="Loading idea editor"
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      <div className="h-3 w-24 animate-pulse rounded bg-surface-muted" />
      <div className="mt-4 h-12 w-64 max-w-full animate-pulse rounded bg-surface-muted" />
      <div className="mt-10 grid gap-5 sm:grid-cols-[minmax(0,1fr)_14rem]">
        <div className="h-24 animate-pulse rounded-card bg-surface-muted" />
        <div className="h-24 animate-pulse rounded-card bg-surface-muted" />
      </div>
      <div className="mt-6 h-16 animate-pulse rounded-card bg-surface-muted" />
      <div className="mt-6 h-96 animate-pulse rounded-surface bg-surface-muted" />
    </section>
  );
}

function IdeaFormLoadError({
  message,
  notFound = false,
  onRetry,
}: {
  message: string;
  notFound?: boolean;
  onRetry: () => void;
}) {
  return (
    <section className="idea-empty-state" role="alert">
      <p className="font-mono text-label uppercase text-accent">
        {notFound ? "Missing page" : "Page unavailable"}
      </p>
      <h1 className="mt-3 text-2xl font-semibold">
        {notFound
          ? "This idea could not be found."
          : "The editor could not be opened."}
      </h1>
      <p className="mt-3 max-w-xl text-muted-foreground">{message}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        {!notFound ? (
          <button
            type="button"
            onClick={onRetry}
            className="min-h-11 rounded-control bg-primary px-4 font-medium text-primary-foreground"
          >
            Retry
          </button>
        ) : null}
        <Link
          to="/ideas"
          className="inline-flex min-h-11 items-center rounded-control border border-border-strong px-4 font-medium"
        >
          Back to ideas
        </Link>
      </div>
    </section>
  );
}

function IdeaEditForbidden({ ideaId }: { ideaId: string }) {
  return (
    <section className="idea-empty-state" role="alert">
      <p className="font-mono text-label uppercase text-accent">
        Read-only page
      </p>
      <h1 className="mt-3 text-2xl font-semibold">
        Only the author can revise this idea.
      </h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        You can still read the complete note and follow its development.
      </p>
      <Link
        to="/ideas/$ideaId"
        params={{ ideaId }}
        className="mt-6 inline-flex min-h-11 items-center rounded-control border border-border-strong px-4 font-medium"
      >
        View idea
      </Link>
    </section>
  );
}

function invalidateIdeaCollections(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["ideas"] }),
    queryClient.invalidateQueries({ queryKey: ["tags"] }),
    queryClient.invalidateQueries({ queryKey: ["search"] }),
  ]);
}

export function CreateIdeaPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: (value: IdeaFormSubmission) => createIdea(value),
    onSuccess: async ({ idea }) => {
      queryClient.setQueryData(ideaQueryKey(idea.id), idea);
      await invalidateIdeaCollections(queryClient);
      toast.success("Idea created");
      await navigate({
        to: "/ideas/$ideaId",
        params: { ideaId: idea.id },
        replace: true,
      });
    },
    onError: (error) => {
      toast.error("Failed to create idea", { description: error.message });
    },
  });

  return (
    <section>
      <IdeaFormHeader mode="create" />
      <IdeaForm
        mode="create"
        initialValues={{
          title: "",
          content: "",
          status: "DRAFT",
          tags: [],
        }}
        submissionError={mutation.error?.message}
        onCancel={() => void navigate({ to: "/ideas" })}
        onSubmit={async (value) => {
          try {
            await mutation.mutateAsync(value);
          } catch {
            // The mutation renders and announces its error without clearing the form.
          }
        }}
      />
    </section>
  );
}

export function EditIdeaPage() {
  const { ideaId } = editRouteApi.useParams();
  const { currentUser } = authenticatedRouteApi.useRouteContext();
  const queryClient = useQueryClient();
  const navigate = editRouteApi.useNavigate();
  const ideaQuery = useQuery(ideaQueryOptions(ideaId));
  const mutation = useMutation({
    mutationFn: (value: IdeaFormSubmission) => updateIdea(ideaId, value),
    onSuccess: async ({ idea }) => {
      queryClient.setQueryData(ideaQueryKey(idea.id), idea);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ideaQueryKey(idea.id) }),
        invalidateIdeaCollections(queryClient),
      ]);
      toast.success("Idea updated");
      await navigate({
        to: "/ideas/$ideaId",
        params: { ideaId: idea.id },
        replace: true,
      });
    },
    onError: (error) => {
      toast.error("Failed to update idea", { description: error.message });
    },
  });

  if (ideaQuery.isPending) return <IdeaFormSkeleton />;

  if (ideaQuery.isError) {
    const notFound =
      ideaQuery.error instanceof ApiClientError &&
      ideaQuery.error.status === 404;
    return (
      <IdeaFormLoadError
        message={ideaQuery.error.message}
        notFound={notFound}
        onRetry={() => void ideaQuery.refetch()}
      />
    );
  }

  const idea = ideaQuery.data;

  if (idea.author.id !== currentUser.id) {
    return <IdeaEditForbidden ideaId={ideaId} />;
  }

  return (
    <section>
      <IdeaFormHeader mode="edit" />
      <IdeaForm
        mode="edit"
        initialValues={{
          title: idea.title,
          content: idea.content,
          status: idea.status,
          tags: idea.tags.map((tag) => tag.name),
        }}
        submissionError={mutation.error?.message}
        onCancel={() =>
          void navigate({
            to: "/ideas/$ideaId",
            params: { ideaId },
          })
        }
        onSubmit={async (value) => {
          try {
            await mutation.mutateAsync(value);
          } catch {
            // The mutation renders and announces its error without clearing the form.
          }
        }}
      />
    </section>
  );
}
