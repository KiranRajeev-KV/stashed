import {
  twArchiveFooter,
  twArchiveLogo,
  twArchiveMain,
  twArchiveShell,
  twArchiveWrap,
} from "../../styles/archive-styles.js";
import { Link } from "@tanstack/react-router";
import { Layers3, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { Navbar } from "./navbar.js";
type PublicArchiveShellProps = { children: ReactNode };

export function PublicArchiveShell({ children }: PublicArchiveShellProps) {
  return (
    <div className={`${twArchiveShell} min-h-screen bg-background`}>
      <Navbar />
      <main
        id="app-content"
        tabIndex={-1}
        className={`${twArchiveMain} ${twArchiveWrap}`}
      >
        {children}
      </main>
      <footer className={`${twArchiveFooter} ${twArchiveWrap}`}>
        <Link to="/" className={twArchiveLogo}>
          <Layers3 size={19} aria-hidden="true" />
          stashed.
        </Link>
        <p>A home for ideas worth coming back to.</p>
        <Link to="/">
          Back to the beginning <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      </footer>
    </div>
  );
}
