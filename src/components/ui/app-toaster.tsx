import {
  twStashedToast,
  twStashedToastClose,
  twStashedToastDescription,
} from "../../styles/common-styles.js";
import * as React from "react";
import { Toaster } from "sonner";

type ToasterTheme = "light" | "dark";

function readResolvedTheme(): ToasterTheme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function AppToaster() {
  const [theme, setTheme] = React.useState<ToasterTheme>(readResolvedTheme);

  React.useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => setTheme(readResolvedTheme()));
    observer.observe(root, {
      attributeFilter: ["data-theme"],
      attributes: true,
    });

    return () => observer.disconnect();
  }, []);

  return (
    <Toaster
      theme={theme}
      position="bottom-right"
      closeButton
      visibleToasts={3}
      toastOptions={{
        classNames: {
          toast: twStashedToast,
          title: "stashed-toast-title",
          description: twStashedToastDescription,
          closeButton: twStashedToastClose,
        },
      }}
    />
  );
}
