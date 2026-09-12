import { LoaderCircle, RefreshCw } from "lucide-react";
import { Link, type ErrorComponentProps } from "@tanstack/react-router";
import { Button } from "../ui/button.js";
import { buttonStyles } from "../ui/button-variants.js";
import { PageState, StandaloneStateLayout } from "./page-state.js";

export function AuthLoadingScreen() {
  return (
    <StandaloneStateLayout>
      <PageState
        role="status"
        label="Stashed"
        icon={
          <LoaderCircle className="animate-spin motion-reduce:animate-none" />
        }
        title="Checking your session…"
        description="Your workspace will be ready in a moment."
      />
    </StandaloneStateLayout>
  );
}

export function AuthErrorScreen({ error, reset }: ErrorComponentProps) {
  return (
    <StandaloneStateLayout>
      <PageState
        role="alert"
        label="Session unavailable"
        icon={<RefreshCw />}
        title="We couldn’t check your sign-in."
        description={
          error.message ||
          "Stashed couldn’t reach the session service. Please try again."
        }
        actions={
          <>
            <Button variant="primary" onClick={reset}>
              Try again
            </Button>
            <Link to="/" className={buttonStyles({ variant: "ghost" })}>
              Return home
            </Link>
          </>
        }
      />
    </StandaloneStateLayout>
  );
}
