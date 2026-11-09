export type AuroraVariant = "light" | "dark";

/**
 * Slowly drifting olive glows and a faint grid behind a page.
 * By default it is fixed behind everything (z-index -1) and ignores the pointer.
 * Use "light" on most pages and "dark" on the slide-to-match page.
 * With `contained` it fills its parent instead (used inside the match popup).
 * Motion is CSS only and stops when the device asks for reduced motion.
 */
export function AuroraBackground({
  variant = "light",
  contained = false,
}: {
  variant?: AuroraVariant;
  contained?: boolean;
}) {
  return (
    <div aria-hidden="true" className={`aurora aurora-${variant}${contained ? " aurora-contained" : ""}`}>
      <span className="aurora-blob aurora-a" />
      <span className="aurora-blob aurora-b" />
      <span className="aurora-blob aurora-c" />
      <span className="aurora-grid" />
    </div>
  );
}
