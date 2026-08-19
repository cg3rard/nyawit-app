export function SkeletonBlock({ className = "" }) {
  return <div className={`skeleton ${className}`} />;
}

export function KPISkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-2xl bg-white p-5 shadow-sm">
          <SkeletonBlock className="h-4 w-24 mb-3" />
          <SkeletonBlock className="h-8 w-32 mb-2" />
          <SkeletonBlock className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <SkeletonBlock className="h-5 w-40 mb-4" />
      <div className="space-y-3">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <SkeletonBlock className="h-4 w-6" />
            <SkeletonBlock className="h-4 flex-1" />
            <SkeletonBlock className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm space-y-3">
      <SkeletonBlock className="h-5 w-40" />
      <SkeletonBlock className="h-24 w-full" />
      <SkeletonBlock className="h-4 w-32" />
    </div>
  );
}
