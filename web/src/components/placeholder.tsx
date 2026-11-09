import { Badge } from "@/components/ui/badge";

/** Shown on pages that are built in a later stage, so every link works from day one. */
export function Placeholder({
  title,
  stage,
  children,
}: {
  title: string;
  stage: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
      <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface/60 p-8">
        <Badge variant="info">Arrives in {stage}</Badge>
        <p className="mt-3 max-w-xl text-sm text-muted">
          This room is still under construction. The navigation, colours and animations already work here, so
          you can judge the feel before we build the real thing.
        </p>
        {children}
      </div>
    </div>
  );
}
