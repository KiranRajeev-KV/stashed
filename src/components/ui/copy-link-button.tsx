import { useMutation } from "@tanstack/react-query";
import { Check, Link2 } from "lucide-react";
import { Button } from "./button.js";
import { ActionFeedback } from "./action-feedback.js";

export function CopyLinkButton({
  isPrivate,
  subject = "idea",
}: {
  isPrivate: boolean;
  subject?: string;
}) {
  const copy = useMutation({
    mutationFn: () => navigator.clipboard.writeText(window.location.href),
  });
  return (
    <div className="flex min-w-0 flex-col items-end gap-1">
      <Button
        variant="ghost"
        loading={copy.isPending}
        loadingLabel="Copying…"
        onClick={() => copy.mutate()}
      >
        {copy.isSuccess ? (
          <Check size={16} aria-hidden="true" />
        ) : (
          <Link2 size={16} aria-hidden="true" />
        )}
        {copy.isSuccess ? "Copied" : "Copy link"}
      </Button>
      <ActionFeedback
        state={
          copy.isError
            ? "error"
            : copy.isSuccess
              ? "success"
              : copy.isPending
                ? "pending"
                : "idle"
        }
        className="max-w-56 text-right"
      >
        {copy.isError
          ? "Couldn’t copy the link. Copy the address from your browser, or try again."
          : copy.isSuccess
            ? isPrivate
              ? `Link copied. This ${subject} is still private.`
              : "Link copied to clipboard."
            : copy.isPending
              ? "Copying link…"
              : null}
      </ActionFeedback>
    </div>
  );
}
