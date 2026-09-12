import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ideaQueryKey,
  updateIdea,
  type IdeaListItem,
} from "../../api/ideas.js";
import { ActionFeedback } from "../../components/ui/action-feedback.js";
import type { IdeaVisibility } from "./idea-visibility.js";
import { VisibilitySelect } from "./visibility-select.js";

export function IdeaVisibilityEditor({
  idea,
}: {
  idea: Pick<IdeaListItem, "id" | "visibility">;
}) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (visibility: IdeaVisibility) =>
      updateIdea(idea.id, { visibility }),
    onSuccess: async ({ idea: updatedIdea }) => {
      queryClient.setQueryData(ideaQueryKey(updatedIdea.id), updatedIdea);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["ideas"] }),
        queryClient.invalidateQueries({ queryKey: ["search"] }),
      ]);
    },
  });

  return (
    <VisibilitySelect
      className="min-w-0"
      label="Change visibility"
      labelClassName="sr-only"
      variant="inline"
      value={idea.visibility}
      disabled={mutation.isPending}
      onValueChange={(visibility) => {
        if (
          visibility &&
          visibility !== idea.visibility &&
          !mutation.isPending
        ) {
          mutation.mutate(visibility);
        }
      }}
      description={
        <ActionFeedback
          state={
            mutation.isPending ? "pending" : mutation.isError ? "error" : "idle"
          }
        >
          {mutation.isPending
            ? "Updating visibility…"
            : mutation.isError
              ? `Visibility wasn’t changed. ${mutation.error.message} Choose an option to try again.`
              : null}
        </ActionFeedback>
      }
    />
  );
}
