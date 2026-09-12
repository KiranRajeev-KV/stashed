import { PageState } from "../../components/states/page-state.js";
import { Button } from "../../components/ui/button.js";
import { FileQuestion, RefreshCw, LockKeyhole } from "lucide-react";
import { buttonStyles } from "../../components/ui/button-variants.js";
import { twAnimatePulse } from "../../styles/common-styles.js";
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
import { Component, lazy, Suspense, type ComponentProps } from "react";
import type { IdeaFormSubmission } from "./idea-form.js";

const loadIdeaForm = () =>
  lazy(() =>
    import("./idea-form.js").then((module) => ({ default: module.IdeaForm })),
  );

class IdeaForm extends Component<
  ComponentProps<ReturnType<typeof loadIdeaForm>>
> {
  state = { failed: false, Form: loadIdeaForm() };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <IdeaFormLoadError
          message="The editor couldn’t load. Check your connection and try again."
          onRetry={() => this.setState({ failed: false, Form: loadIdeaForm() })}
        />
      );
    }
    const Form = this.state.Form;
    return (
      <Suspense fallback={<IdeaFormSkeleton />}>
        <Form {...this.props} />
      </Suspense>
    );
  }
}

const editRouteApi = getRouteApi("/_authenticated/ideas/$ideaId/edit");
const authenticatedRouteApi = getRouteApi("/_authenticated");

function IdeaFormSkeleton() {
  return (
    <section
      aria-label="Loading idea editor"
      aria-busy="true"
      role="status"
      className={`${twAnimatePulse} motion-reduce:animate-none`}
    >
      <div
        className="flex justify-between border-b border-border/70 py-4"
        aria-hidden="true"
      >
        <div className="h-11 w-32 rounded-control bg-surface-muted" />
        <div className="h-11 w-28 rounded-control bg-surface-muted" />
      </div>
      <div
        className="grid gap-10 pt-9 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-12"
        aria-hidden="true"
      >
        <div className="space-y-8">
          <div className="h-24 w-4/5 rounded-control bg-surface-muted" />
          <div className="h-96 rounded-card bg-surface-muted" />
        </div>
        <div className="space-y-6">
          <div className="h-4 w-16 rounded bg-surface-muted" />
          <div className="h-16 rounded-control bg-surface-muted" />
          <div className="h-16 rounded-control bg-surface-muted" />
          <div className="h-16 rounded-control bg-surface-muted" />
        </div>
      </div>
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
    <PageState
      role="alert"
      label={notFound ? "Idea unavailable" : "Editor unavailable"}
      icon={notFound ? <FileQuestion /> : <RefreshCw />}
      title={
        notFound
          ? "This idea could not be found."
          : "The editor could not be opened."
      }
      description={
        message || "Please try again, or return to the ideas archive."
      }
      actions={
        <>
          {!notFound ? (
            <Button variant="primary" onClick={onRetry}>
              Try again
            </Button>
          ) : null}
          <Link
            to="/ideas"
            className={buttonStyles({
              variant: notFound ? "primary" : "ghost",
            })}
          >
            Back to ideas
          </Link>
        </>
      }
    />
  );
}

function IdeaEditForbidden({ ideaId }: { ideaId: string }) {
  return (
    <PageState
      label="Read-only idea"
      icon={<LockKeyhole />}
      title="Only the author can revise this idea."
      description="You can still read the complete idea and see future revisions from its author."
      actions={
        <Link
          to="/ideas/$ideaId"
          params={{ ideaId }}
          className={buttonStyles({ variant: "primary" })}
        >
          View idea
        </Link>
      }
    />
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
  });

  return (
    <section>
      <IdeaForm
        mode="create"
        initialValues={{
          title: "",
          content: "",
          status: "DRAFT",
          visibility: "PUBLIC",
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
      <IdeaForm
        mode="edit"
        initialValues={{
          title: idea.title,
          content: idea.content,
          status: idea.status,
          visibility: idea.visibility,
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
