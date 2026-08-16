import { createFileRoute } from "@tanstack/react-router";

import { LandingPage } from "../features/landing/landing-page.js";

export const Route = createFileRoute("/")({
  component: LandingPage,
});
