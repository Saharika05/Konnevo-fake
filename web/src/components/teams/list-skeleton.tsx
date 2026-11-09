export function ListSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      {[0, 1].map((i) => (
        <div key={i} className="h-40 animate-pulse rounded-2xl border border-border bg-surface" />
      ))}
    </div>
  );
}
