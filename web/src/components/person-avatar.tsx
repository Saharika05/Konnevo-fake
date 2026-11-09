import { cn } from "@/lib/utils";

const COLOURS = [
  "bg-moss-dark text-soft-white",
  "bg-olive-700 text-soft-white",
  "bg-brick text-soft-white",
  "bg-sage text-deep-olive",
];

function colourFor(name: string) {
  let sum = 0;
  for (const char of name) sum += char.charCodeAt(0);
  return COLOURS[sum % COLOURS.length];
}

/** Initial-in-a-circle, as in the designs. A photo can replace it later. */
export function PersonAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
        colourFor(name),
        className,
      )}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
