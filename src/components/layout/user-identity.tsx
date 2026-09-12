import {
  twUserIdentity,
  twUserIdentityTooltip,
  twUserIdentityTooltipName,
  twUserIdentityTooltipUsername,
  twUserIdentityTrigger,
} from "../../styles/navigation-styles.js";
import { useId, useState } from "react";
import type { CurrentUser } from "../../api/auth.js";
type AppShellProps = { user: CurrentUser };
function UserAvatar({ user }: AppShellProps) {
  const initials = user.displayName.trim().slice(0, 2).toUpperCase() || "ST";

  if (user.identity.avatarUrl) {
    return (
      <img
        src={user.identity.avatarUrl}
        alt=""
        width="32"
        height="32"
        className="size-8 shrink-0 rounded-full border border-border object-cover"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-muted font-mono text-xs font-medium text-muted-foreground"
    >
      {initials}
    </span>
  );
}

export function UserIdentity({ user }: AppShellProps) {
  const tooltipId = useId();
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const isTooltipVisible = !isDismissed && (isHovered || isFocused);

  return (
    <span
      className={twUserIdentity}
      onMouseEnter={() => {
        setIsHovered(true);
        setIsDismissed(false);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        if (!isFocused) {
          setIsDismissed(false);
        }
      }}
    >
      <button
        type="button"
        className={twUserIdentityTrigger}
        aria-describedby={tooltipId}
        onFocus={() => {
          setIsFocused(true);
          setIsDismissed(false);
        }}
        onBlur={() => {
          setIsFocused(false);
          if (!isHovered) {
            setIsDismissed(false);
          }
        }}
        onClick={() => setIsDismissed(false)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setIsDismissed(true);
          }
        }}
      >
        <UserAvatar user={user} />
        <span className="sr-only">Signed-in account</span>
      </button>
      <span
        id={tooltipId}
        role="tooltip"
        className={twUserIdentityTooltip}
        data-visible={isTooltipVisible ? "true" : "false"}
      >
        <span className={twUserIdentityTooltipName}>{user.displayName}</span>
        <span className={twUserIdentityTooltipUsername}>
          @{user.identity.username}
        </span>
      </span>
    </span>
  );
}
