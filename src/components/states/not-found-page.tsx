import { FileQuestion } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { buttonStyles } from "../ui/button-variants.js";
import { PageState, StandaloneStateLayout } from "./page-state.js";

export function NotFoundPage() {
  return (
    <StandaloneStateLayout>
      <PageState
        label="Page not found · 404"
        icon={<FileQuestion />}
        title="That page isn’t in this archive."
        description="The address may have changed, or the page may no longer exist. You can explore the ideas that are available."
        actions={
          <>
            <Link to="/ideas" className={buttonStyles({ variant: "primary" })}>
              Explore ideas
            </Link>
            <Link to="/" className={buttonStyles({ variant: "ghost" })}>
              Return home
            </Link>
          </>
        }
      />
    </StandaloneStateLayout>
  );
}
