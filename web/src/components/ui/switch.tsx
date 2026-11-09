"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** An on/off switch. Works with the keyboard (Space or Enter) and is read out as a switch. */
export function Switch({
  checked,
  onCheckedChange,
  className,
  ...props
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange">) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 cursor-pointer rounded-full border border-input transition-colors disabled:opacity-50",
        checked ? "bg-primary" : "bg-subtle",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-0.5 top-0.5 h-4.5 w-4.5 rounded-full transition-transform",
          checked ? "translate-x-5 bg-primary-foreground" : "bg-moss-dark",
        )}
      />
    </button>
  );
}
