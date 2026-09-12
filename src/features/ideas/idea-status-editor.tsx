import {
  twIdeaStatusEditor,
  twIdeaStatusTrigger,
} from "../../styles/archive-styles.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { ActionFeedback } from "../../components/ui/action-feedback.js";

import {
  ideaQueryKey,
  type IdeaListItem,
  type IdeaStatus,
  updateIdea,
} from "../../api/ideas.js";
import { StatusSelect } from "./status-select.js";

type IdeaStatusEditorProps = {
  idea: Pick<IdeaListItem, "id" | "status">;
};

export function IdeaStatusEditor({ idea }: IdeaStatusEditorProps) {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = React.useState(idea.status);
  const mutation = useMutation({
    mutationFn: (status: IdeaStatus) => updateIdea(idea.id, { status }),
    onSuccess: async ({ idea: updatedIdea }) => {
      setSelectedStatus(updatedIdea.status);
      queryClient.setQueryData(ideaQueryKey(updatedIdea.id), updatedIdea);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["ideas"] }),
        queryClient.invalidateQueries({ queryKey: ["search"] }),
      ]);
    },
    onError: () => {
      setSelectedStatus(idea.status);
    },
  });

  React.useEffect(() => {
    if (!mutation.isPending) setSelectedStatus(idea.status);
  }, [idea.status, mutation.isPending]);

  function handleStatusChange(status?: IdeaStatus) {
    if (!status || status === selectedStatus || mutation.isPending) return;

    setSelectedStatus(status);
    mutation.mutate(status);
  }

  return (
    <div className={twIdeaStatusEditor}>
      <StatusSelect
        className="min-w-0"
        disabled={mutation.isPending}
        icon="down"
        iconClassName="text-current"
        label="Change status"
        labelClassName="sr-only"
        onValueChange={handleStatusChange}
        triggerClassName={twIdeaStatusTrigger}
        triggerDataStatus={selectedStatus}
        variant="badge"
        value={selectedStatus}
        description={
          <ActionFeedback
            state={
              mutation.isError
                ? "error"
                : mutation.isPending
                  ? "pending"
                  : "idle"
            }
          >
            {mutation.isPending
              ? "Updating status…"
              : mutation.isError
                ? `Status wasn’t changed. ${mutation.error.message} Choose a status to try again.`
                : null}
          </ActionFeedback>
        }
      />
    </div>
  );
}
