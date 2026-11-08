import { SkeletonCards, SkeletonTable } from "../../components/Skeleton";

// Shown instantly during route transitions across all ERP modules, so
// navigation never flashes a blank screen before data resolves.
export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-7 w-48 animate-pulse rounded-lg bg-vendora/10 dark:bg-white/10" />
        <div className="h-10 w-32 animate-pulse rounded-xl bg-vendora/10 dark:bg-white/10" />
      </div>
      <SkeletonCards count={4} />
      <SkeletonTable rows={6} cols={6} />
    </div>
  );
}
