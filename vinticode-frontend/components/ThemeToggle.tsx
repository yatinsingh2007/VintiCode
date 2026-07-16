"use client";

import { useContext } from "react";
import { Moon, Sun } from "lucide-react";
import { ThemeContext } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/*
  One toggle, used by both the app and the admin console. The dashboard
  previously inlined its own; the admin console had none at all and was
  hardcoded to dark, so the two halves of the product disagreed.
*/
export function ThemeToggle({
  className,
  size = "icon",
}: {
  className?: string;
  size?: "icon" | "icon-sm";
}) {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const next = theme === "dark" ? "light" : "dark";

  return (
    <Button
      variant="outline"
      size={size}
      onClick={toggleTheme}
      className={cn("rounded-lg", className)}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
    >
      {/* Both icons render and cross-fade so the button never reflows. */}
      <span className="relative inline-flex size-4 items-center justify-center">
        <Sun
          aria-hidden="true"
          className={cn(
            "absolute size-4 transition-all duration-300",
            theme === "dark" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
          )}
        />
        <Moon
          aria-hidden="true"
          className={cn(
            "absolute size-4 transition-all duration-300",
            theme === "dark" ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
          )}
        />
      </span>
    </Button>
  );
}

export default ThemeToggle;
