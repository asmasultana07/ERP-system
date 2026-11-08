"use client";

// Lightweight, theme-aware skeletons used across modules for loading states.

export function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-vendora/10 dark:bg-white/10 ${className}`}
    />
  );
}

export function SkeletonText({ lines = 3, className = "" }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3.5 ${i === lines - 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  );
}

// Table skeleton matching the list-page layout.
export function SkeletonTable({ rows = 6, cols = 6 }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-vendora/10 bg-surface shadow-xs">
      <div className="border-b border-vendora/10 bg-vendora-bg/60 px-5 py-3.5">
        <Skeleton className="h-3 w-40" />
      </div>
      <div className="divide-y divide-vendora/5">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-5 py-4">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton
                key={c}
                className={`h-4 ${c === 0 ? "w-40" : c === cols - 1 ? "ml-auto w-16" : "w-24"}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Grid of stat-card skeletons for the dashboard.
export function SkeletonCards({ count = 4 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-vendora/10 bg-surface p-5 shadow-xs"
        >
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-4 h-8 w-28" />
          <Skeleton className="mt-4 h-3 w-full" />
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
