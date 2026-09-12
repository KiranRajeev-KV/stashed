import { twArchiveMain, twArchiveWrap } from "../../styles/archive-styles.js";
import { Outlet } from "@tanstack/react-router";
import type { CurrentUser } from "../../api/auth.js";
import { Navbar } from "./navbar.js";

export function AppShell({ user }: { user: CurrentUser }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <main
        id="app-content"
        tabIndex={-1}
        className={`${twArchiveMain} ${twArchiveWrap}`}
      >
        <Outlet />
      </main>
    </div>
  );
}
