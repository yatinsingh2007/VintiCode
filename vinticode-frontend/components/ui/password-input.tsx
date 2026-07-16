"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/*
  The show/hide control was previously a bare <svg onClick>. That is not
  focusable, not reachable by keyboard, exposes no accessible name, and
  doesn't respond to Enter/Space — so keyboard and screen-reader users had
  no way to reveal what they'd typed. It was also positioned with a magic
  `top-7` measured from the label, which drifts the moment a label wraps.

  This is a real <button> with an accessible name and state, positioned
  against the input itself rather than the group.
*/
export function PasswordInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={cn("pr-10", className)}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        // Toggling doesn't move focus, so the field keeps its caret.
        tabIndex={0}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className={cn(
          "absolute right-0 top-0 flex h-9 w-10 cursor-pointer items-center justify-center rounded-r-md",
          "text-muted-foreground transition-colors hover:text-foreground",
          "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring"
        )}
      >
        {visible ? (
          <EyeOff className="size-4" aria-hidden="true" />
        ) : (
          <Eye className="size-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

export default PasswordInput;
